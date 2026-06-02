"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConnectionsService = class ConnectionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchUsers(currentUserId, query) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    { isofficial: false },
                    {
                        OR: [
                            {
                                name: {
                                    contains: query.trim(),
                                    mode: 'insensitive',
                                },
                            },
                            {
                                email: {
                                    contains: query.trim(),
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                profilephoto: true,
                experiencelevel: true,
            },
            take: 20,
        });
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const connection = await this.prisma.connection.findFirst({
                where: {
                    OR: [
                        { initiatorid: currentUserId, receiverid: user.id },
                        { initiatorid: user.id, receiverid: currentUserId },
                    ],
                },
            });
            return {
                id: user.id,
                name: user.name,
                profilePhoto: user.profilephoto,
                experienceLevel: user.experiencelevel,
                isConnected: connection?.status === 'Accepted',
                hasPendingRequest: connection?.status === 'Pending',
            };
        }));
        return usersWithStatus;
    }
    async sendConnectionRequestById(initiatorId, receiverId) {
        if (!receiverId) {
            throw new common_1.BadRequestException('Receiver ID is required');
        }
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new common_1.NotFoundException('User not found');
        }
        if (receiver.id === initiatorId) {
            throw new common_1.BadRequestException('Cannot connect with yourself');
        }
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorid: initiatorId, receiverid: receiver.id },
                    { initiatorid: receiver.id, receiverid: initiatorId },
                ],
            },
        });
        if (existingConnection) {
            if (existingConnection.status === 'Accepted') {
                throw new common_1.BadRequestException('Already connected');
            }
            if (existingConnection.status === 'Pending') {
                throw new common_1.BadRequestException('Connection request already sent');
            }
        }
        const connection = await this.prisma.connection.create({
            data: {
                initiatorid: initiatorId,
                receiverid: receiver.id,
                status: 'Pending',
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
            },
        });
        return this.formatConnectionResponse(connection);
    }
    async sendConnectionRequest(initiatorId, receiverIdentifier) {
        if (!receiverIdentifier) {
            throw new common_1.BadRequestException('Name or email is required');
        }
        const identifier = receiverIdentifier.trim();
        let receiver = await this.prisma.user.findUnique({
            where: { email: identifier },
        });
        if (!receiver) {
            const usersByName = await this.prisma.user.findMany({
                where: {
                    name: {
                        equals: identifier,
                        mode: 'insensitive',
                    },
                },
                take: 2,
            });
            if (usersByName.length === 0) {
                throw new common_1.NotFoundException('User not found with that name or email');
            }
            if (usersByName.length > 1) {
                throw new common_1.BadRequestException('Multiple users found with that name. Please use their email address instead.');
            }
            receiver = usersByName[0];
        }
        if (!receiver) {
            throw new common_1.NotFoundException('User not found');
        }
        if (receiver.id === initiatorId) {
            throw new common_1.BadRequestException('Cannot connect with yourself');
        }
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorid: initiatorId, receiverid: receiver.id },
                    { initiatorid: receiver.id, receiverid: initiatorId },
                ],
            },
        });
        if (existingConnection) {
            if (existingConnection.status === 'Accepted') {
                throw new common_1.BadRequestException('Already connected');
            }
            if (existingConnection.status === 'Pending') {
                throw new common_1.BadRequestException('Connection request already sent');
            }
        }
        const connection = await this.prisma.connection.create({
            data: {
                initiatorid: initiatorId,
                receiverid: receiver.id,
                status: 'Pending',
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
            },
        });
        return this.formatConnectionResponse(connection);
    }
    async acceptConnectionRequest(userId, connectionId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection request not found');
        }
        if (connection.receiverid !== userId) {
            throw new common_1.ForbiddenException('You can only accept requests sent to you');
        }
        if (connection.status === 'Accepted') {
            throw new common_1.BadRequestException('Connection already accepted');
        }
        const updated = await this.prisma.connection.update({
            where: { id: connectionId },
            data: {
                status: 'Accepted',
                acceptedat: new Date(),
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
            },
        });
        return this.formatConnectionResponse(updated);
    }
    async rejectConnectionRequest(userId, connectionId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        if (connection.initiatorid !== userId && connection.receiverid !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.prisma.connection.delete({
            where: { id: connectionId },
        });
        return { message: 'Connection removed successfully' };
    }
    async getPendingRequests(userId) {
        const requests = await this.prisma.connection.findMany({
            where: {
                receiverid: userId,
                status: 'Pending',
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                    },
                },
            },
            orderBy: {
                createdat: 'desc',
            },
        });
        return requests.map((req) => this.formatConnectionResponse(req));
    }
    async getConnections(userId) {
        const connections = await this.prisma.connection.findMany({
            where: {
                OR: [
                    { initiatorid: userId },
                    { receiverid: userId },
                ],
                status: 'Accepted',
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        bio: true,
                        experiencelevel: true,
                        isofficial: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        bio: true,
                        experiencelevel: true,
                        isofficial: true,
                    },
                },
            },
            orderBy: {
                acceptedat: 'desc',
            },
        });
        return connections.map((conn) => {
            const otherUser = conn.initiatorid === userId ? conn.receiver : conn.initiator;
            return {
                connectionId: conn.id,
                user: {
                    id: otherUser.id,
                    name: otherUser.name,
                    profilePhoto: otherUser.profilephoto,
                    bio: otherUser.bio,
                    experienceLevel: otherUser.experiencelevel,
                    isOfficial: otherUser.isofficial ?? false,
                },
                isMuted: conn.ismuted ?? false,
                connectedAt: conn.acceptedat,
            };
        });
    }
    async areConnected(userId1, userId2) {
        const connection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorid: userId1, receiverid: userId2, status: 'Accepted' },
                    { initiatorid: userId2, receiverid: userId1, status: 'Accepted' },
                ],
            },
        });
        return !!connection;
    }
    async muteConnection(userId, targetUserId) {
        const connection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorid: userId, receiverid: targetUserId, status: 'Accepted' },
                    { initiatorid: targetUserId, receiverid: userId, status: 'Accepted' },
                ],
            },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        await this.prisma.connection.update({
            where: { id: connection.id },
            data: { ismuted: true },
        });
        return { message: 'Connection muted successfully', isMuted: true };
    }
    async unmuteConnection(userId, targetUserId) {
        const connection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorid: userId, receiverid: targetUserId, status: 'Accepted' },
                    { initiatorid: targetUserId, receiverid: userId, status: 'Accepted' },
                ],
            },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        await this.prisma.connection.update({
            where: { id: connection.id },
            data: { ismuted: false },
        });
        return { message: 'Connection unmuted successfully', isMuted: false };
    }
    async getMuteStatus(userId, targetUserId) {
        const connection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorid: userId, receiverid: targetUserId, status: 'Accepted' },
                    { initiatorid: targetUserId, receiverid: userId, status: 'Accepted' },
                ],
            },
        });
        return connection?.ismuted ?? false;
    }
    formatConnectionResponse(connection) {
        return {
            id: connection.id,
            status: connection.status,
            createdAt: connection.createdat,
            acceptedAt: connection.acceptedat,
            initiator: {
                id: connection.initiator.id,
                name: connection.initiator.name,
                profilePhoto: connection.initiator.profilephoto,
                experienceLevel: connection.initiator.experiencelevel,
            },
            receiver: {
                id: connection.receiver.id,
                name: connection.receiver.name,
                profilePhoto: connection.receiver.profilephoto,
                experienceLevel: connection.receiver.experiencelevel,
            },
        };
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map