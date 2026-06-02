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
exports.CheersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const connections_service_1 = require("../connections/connections.service");
let CheersService = class CheersService {
    constructor(prisma, connectionsService) {
        this.prisma = prisma;
        this.connectionsService = connectionsService;
    }
    async addCheer(userId, pourId) {
        const pour = await this.prisma.pour.findUnique({
            where: { id: pourId },
            include: { user: true },
        });
        if (!pour) {
            throw new common_1.NotFoundException('Pour not found');
        }
        if (!pour.isshared) {
            throw new common_1.ForbiddenException('Cannot cheer a private pour');
        }
        if (pour.userid !== userId) {
            const areConnected = await this.connectionsService.areConnected(userId, pour.userid);
            if (!areConnected) {
                throw new common_1.ForbiddenException('Can only cheer pours from Fellow Sippers');
            }
        }
        const existingCheer = await this.prisma.cheer.findUnique({
            where: {
                userid_pourid: {
                    userid: userId,
                    pourid: pourId,
                },
            },
        });
        if (existingCheer) {
            throw new common_1.BadRequestException('Already cheered this pour');
        }
        const cheer = await this.prisma.cheer.create({
            data: {
                userid: userId,
                pourid: pourId,
            },
        });
        return {
            id: cheer.id,
            createdAt: cheer.createdat,
        };
    }
    async removeCheer(userId, pourId) {
        const cheer = await this.prisma.cheer.findUnique({
            where: {
                userid_pourid: {
                    userid: userId,
                    pourid: pourId,
                },
            },
        });
        if (!cheer) {
            throw new common_1.NotFoundException('Cheer not found');
        }
        await this.prisma.cheer.delete({
            where: {
                userid_pourid: {
                    userid: userId,
                    pourid: pourId,
                },
            },
        });
        return { message: 'Cheer removed' };
    }
    async getCheersCount(pourId) {
        return this.prisma.cheer.count({
            where: { pourid: pourId },
        });
    }
    async hasUserCheered(userId, pourId) {
        const cheer = await this.prisma.cheer.findUnique({
            where: {
                userid_pourid: {
                    userid: userId,
                    pourid: pourId,
                },
            },
        });
        return !!cheer;
    }
};
exports.CheersService = CheersService;
exports.CheersService = CheersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        connections_service_1.ConnectionsService])
], CheersService);
//# sourceMappingURL=cheers.service.js.map