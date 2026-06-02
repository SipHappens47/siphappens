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
exports.PoursService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const badges_service_1 = require("../badges/badges.service");
let PoursService = class PoursService {
    constructor(prisma, badgesService) {
        this.prisma = prisma;
        this.badgesService = badgesService;
    }
    async createPour(userId, dto) {
        const { flavorTagIds, ...pourData } = dto;
        const pour = await this.prisma.pour.create({
            data: {
                userid: userId,
                spiritid: dto.spiritId,
                whyithit: dto.whyItHit,
                isshared: dto.isShared ?? false,
                image: dto.image,
                ...(flavorTagIds && {
                    flavortags: {
                        create: flavorTagIds.map((tagId) => ({
                            flavortagid: tagId,
                        })),
                    },
                }),
            },
            include: {
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
            },
        });
        await this.badgesService.checkAndUnlockBadges(userId);
        return this.formatPourResponse(pour);
    }
    async getPours(userId, filters) {
        const where = {
            userid: userId,
        };
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
        if (filters.startDate || filters.endDate) {
            where.createdat = {};
            if (filters.startDate) {
                where.createdat.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdat.lte = new Date(filters.endDate);
            }
        }
        if (filters.search) {
            where.OR = [
                { whyithit: { contains: filters.search, mode: 'insensitive' } },
                { spirit: { name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }
        const pours = await this.prisma.pour.findMany({
            where,
            include: {
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
            },
            orderBy: {
                createdat: 'desc',
            },
        });
        return pours.map((pour) => this.formatPourResponse(pour));
    }
    async getPour(userId, id) {
        const pour = await this.prisma.pour.findUnique({
            where: { id },
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
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
        });
        if (!pour) {
            throw new common_1.NotFoundException('Pour not found');
        }
        if (pour.userid !== userId && !pour.isshared) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.formatPourResponse(pour);
    }
    async updatePour(userId, id, dto) {
        const existingPour = await this.prisma.pour.findUnique({ where: { id } });
        if (!existingPour) {
            throw new common_1.NotFoundException('Pour not found');
        }
        if (existingPour.userid !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const { flavorTagIds, ...pourData } = dto;
        if (flavorTagIds !== undefined) {
            await this.prisma.pourflavortag.deleteMany({
                where: { pourid: id },
            });
        }
        const pour = await this.prisma.pour.update({
            where: { id },
            data: {
                ...(pourData.whyItHit && { whyithit: pourData.whyItHit }),
                ...(pourData.image !== undefined && { image: pourData.image }),
                ...(pourData.isShared !== undefined && { isshared: pourData.isShared }),
                ...(flavorTagIds && {
                    flavortags: {
                        create: flavorTagIds.map((tagId) => ({
                            flavortagid: tagId,
                        })),
                    },
                }),
            },
            include: {
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
            },
        });
        await this.badgesService.checkAndUnlockBadges(userId);
        return this.formatPourResponse(pour);
    }
    async deletePour(userId, id) {
        const pour = await this.prisma.pour.findUnique({ where: { id } });
        if (!pour) {
            throw new common_1.NotFoundException('Pour not found');
        }
        if (pour.userid !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.prisma.pour.delete({ where: { id } });
        return { message: 'Pour deleted successfully' };
    }
    async getUserPublicPours(userId) {
        const pours = await this.prisma.pour.findMany({
            where: {
                userid: userId,
                isshared: true,
            },
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
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
            orderBy: {
                createdat: 'desc',
            },
        });
        return pours.map((pour) => this.formatPourResponse(pour));
    }
    formatPourResponse(pour) {
        return {
            id: pour.id,
            whyItHit: pour.whyithit,
            isShared: pour.isshared,
            image: pour.image,
            createdAt: pour.createdat,
            updatedAt: pour.updatedat,
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
                flavorTags: pour.spirit.flavortags
                    ? pour.spirit.flavortags.map((ft) => ({
                        id: ft.flavortag.id,
                        name: ft.flavortag.name,
                    }))
                    : undefined,
            },
            flavorTags: pour.flavortags.map((ft) => ({
                id: ft.flavortag.id,
                name: ft.flavortag.name,
            })),
        };
    }
};
exports.PoursService = PoursService;
exports.PoursService = PoursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        badges_service_1.BadgesService])
], PoursService);
//# sourceMappingURL=pours.service.js.map