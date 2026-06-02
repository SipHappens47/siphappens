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
exports.BarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const connections_service_1 = require("../connections/connections.service");
const cheers_service_1 = require("../cheers/cheers.service");
let BarService = class BarService {
    constructor(prisma, connectionsService, cheersService) {
        this.prisma = prisma;
        this.connectionsService = connectionsService;
        this.cheersService = cheersService;
    }
    async getBarFeed(userId, filters) {
        const connections = await this.prisma.connection.findMany({
            where: {
                OR: [
                    { initiatorid: userId, status: 'Accepted' },
                    { receiverid: userId, status: 'Accepted' },
                ],
            },
            select: {
                initiatorid: true,
                receiverid: true,
                ismuted: true,
            },
        });
        const fellowSipperIds = connections
            .filter((conn) => !conn.ismuted)
            .map((conn) => conn.initiatorid === userId ? conn.receiverid : conn.initiatorid);
        const where = {
            isshared: true,
        };
        if (fellowSipperIds.length > 0) {
            where.userid = { in: fellowSipperIds };
        }
        else {
            where.userid = { not: userId };
        }
        if (filters.category) {
            where.spirit = {
                category: { equals: filters.category, mode: 'insensitive' },
            };
        }
        if (filters.flavorTags) {
            const tags = filters.flavorTags.split(',').map((t) => t.trim());
            where.flavortags = {
                some: {
                    flavortag: {
                        name: { in: tags, mode: 'insensitive' },
                    },
                },
            };
        }
        const pours = await this.prisma.pour.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                        experiencelevel: true,
                        isofficial: true,
                    },
                },
                spirit: {
                    include: {
                        distillery: true,
                    },
                },
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
                cheers: {
                    select: {
                        userid: true,
                    },
                },
            },
            orderBy: {
                createdat: 'desc',
            },
            take: 50,
        });
        const formatted = await Promise.all(pours.map(async (pour) => {
            const hasUserCheered = await this.cheersService.hasUserCheered(userId, pour.id);
            const cheersCount = pour.cheers?.length ?? 0;
            return {
                id: pour.id,
                whyItHit: pour.whyithit,
                image: pour.image,
                createdAt: pour.createdat,
                user: {
                    id: pour.user.id,
                    name: pour.user.name,
                    profilePhoto: pour.user.profilephoto,
                    experienceLevel: pour.user.experiencelevel,
                    isOfficial: pour.user.isofficial ?? false,
                },
                spirit: {
                    id: pour.spirit.id,
                    name: pour.spirit.name,
                    distilleryId: pour.spirit.distillery?.id,
                    distilleryName: pour.spirit.distillery?.name,
                    category: pour.spirit.category,
                    style: pour.spirit.style,
                    abv: pour.spirit.abv ? parseFloat(pour.spirit.abv.toString()) : null,
                    region: pour.spirit.region,
                    bottleImage: pour.spirit.bottleimage,
                    distillery: {
                        id: pour.spirit.distillery?.id,
                        name: pour.spirit.distillery?.name,
                        country: pour.spirit.distillery?.country,
                        region: pour.spirit.distillery?.region,
                    },
                },
                flavorTags: pour.flavortags.map((ft) => ({
                    id: ft.flavortag.id,
                    name: ft.flavortag.name,
                })),
                cheersCount: cheersCount > 0 ? cheersCount : undefined,
                hasUserCheered,
            };
        }));
        return formatted;
    }
};
exports.BarService = BarService;
exports.BarService = BarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        connections_service_1.ConnectionsService,
        cheers_service_1.CheersService])
], BarService);
//# sourceMappingURL=bar.service.js.map