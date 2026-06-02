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
exports.RadarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RadarService = class RadarService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addToRadar(userId, spiritId) {
        const spirit = await this.prisma.spirit.findUnique({
            where: { id: spiritId },
        });
        if (!spirit) {
            throw new common_1.NotFoundException('Spirit not found');
        }
        const existing = await this.prisma.radar.findUnique({
            where: {
                userid_spiritid: {
                    userid: userId,
                    spiritid: spiritId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Spirit already on your radar');
        }
        const radarEntry = await this.prisma.radar.create({
            data: {
                userid: userId,
                spiritid: spiritId,
            },
        });
        return {
            id: radarEntry.id,
            createdAt: radarEntry.createdat,
        };
    }
    async removeFromRadar(userId, spiritId) {
        const radarEntry = await this.prisma.radar.findUnique({
            where: {
                userid_spiritid: {
                    userid: userId,
                    spiritid: spiritId,
                },
            },
        });
        if (!radarEntry) {
            throw new common_1.NotFoundException('Spirit not on your radar');
        }
        await this.prisma.radar.delete({
            where: {
                userid_spiritid: {
                    userid: userId,
                    spiritid: spiritId,
                },
            },
        });
        return { message: 'Removed from radar' };
    }
    async getRadar(userId) {
        const radarEntries = await this.prisma.radar.findMany({
            where: { userid: userId },
            include: {
                spirit: {
                    include: {
                        distillery: true,
                        flavortags: {
                            include: {
                                flavortag: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdat: 'desc',
            },
        });
        return radarEntries.map((entry) => ({
            id: entry.id,
            addedAt: entry.createdat,
            spirit: {
                id: entry.spirit.id,
                name: entry.spirit.name,
                category: entry.spirit.category,
                style: entry.spirit.style,
                abv: entry.spirit.abv ? parseFloat(entry.spirit.abv.toString()) : null,
                region: entry.spirit.region,
                bottleImage: entry.spirit.bottleimage,
                distillery: entry.spirit.distillery ? {
                    id: entry.spirit.distillery.id,
                    name: entry.spirit.distillery.name,
                    country: entry.spirit.distillery.country,
                    region: entry.spirit.distillery.region,
                } : undefined,
                flavorTags: entry.spirit.flavortags.map((ft) => ({
                    id: ft.flavortag.id,
                    name: ft.flavortag.name,
                })),
            },
        }));
    }
    async isOnRadar(userId, spiritId) {
        const entry = await this.prisma.radar.findUnique({
            where: {
                userid_spiritid: {
                    userid: userId,
                    spiritid: spiritId,
                },
            },
        });
        return !!entry;
    }
};
exports.RadarService = RadarService;
exports.RadarService = RadarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RadarService);
//# sourceMappingURL=radar.service.js.map