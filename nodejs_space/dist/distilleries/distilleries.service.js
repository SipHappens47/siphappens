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
exports.DistilleriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DistilleriesService = class DistilleriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async discover(userId) {
        const distilleries = await this.prisma.distillery.findMany({
            where: {
                AND: [
                    { latitude: { not: null } },
                    { longitude: { not: null } },
                ],
            },
            select: {
                id: true,
                name: true,
                country: true,
                region: true,
                latitude: true,
                longitude: true,
                logo: true,
                heroimage: true,
                verified: true,
                ispremium: true,
                followerscount: true,
                isclaimed: true,
            },
        });
        const userFollows = await this.prisma.distilleryfollower.findMany({
            where: { userid: userId },
            select: { distilleryid: true },
        });
        const followedIds = new Set(userFollows.map((f) => f.distilleryid));
        const mapPins = distilleries.map((d) => ({
            id: d.id,
            name: d.name,
            country: d.country,
            region: d.region,
            latitude: d.latitude,
            longitude: d.longitude,
            logo: d.logo,
            heroImage: d.heroimage,
            verified: d.verified,
            isClaimed: d.isclaimed,
            isFollowing: followedIds.has(d.id),
        }));
        return {
            mapPins,
        };
    }
    async search(searchTerm, userId) {
        if (!searchTerm || searchTerm.length === 0) {
            return [];
        }
        const distilleries = await this.prisma.distillery.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                    {
                        spirittypes: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                    {
                        region: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                    {
                        country: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                country: true,
                region: true,
                logo: true,
                heroimage: true,
                verified: true,
                ispremium: true,
                followerscount: true,
                latitude: true,
                longitude: true,
                isclaimed: true,
            },
            take: 20,
            orderBy: {
                followerscount: 'desc',
            },
        });
        const userFollows = await this.prisma.distilleryfollower.findMany({
            where: { userid: userId },
            select: { distilleryid: true },
        });
        const followedIds = new Set(userFollows.map((f) => f.distilleryid));
        return distilleries.map((d) => ({
            id: d.id,
            name: d.name,
            country: d.country,
            region: d.region,
            logo: d.logo,
            heroImage: d.heroimage,
            verified: d.verified,
            isClaimed: d.isclaimed,
            isPremium: d.ispremium,
            followersCount: d.followerscount ?? 0,
            latitude: d.latitude,
            longitude: d.longitude,
            isFollowing: followedIds.has(d.id),
        }));
    }
    async getProfile(distilleryId, userId) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
            include: {
                _count: {
                    select: {
                        pours: true,
                        followers: true,
                    },
                },
            },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        const officialSpiritsCount = await this.prisma.spirit.count({
            where: {
                distilleryid: distilleryId,
                isusercreated: false,
            },
        });
        const isFollowing = await this.prisma.distilleryfollower.findUnique({
            where: {
                userid_distilleryid: {
                    userid: userId,
                    distilleryid: distilleryId,
                },
            },
        });
        return {
            id: distillery.id,
            name: distillery.name,
            country: distillery.country,
            region: distillery.region,
            logo: distillery.logo,
            heroImage: distillery.heroimage,
            bio: distillery.bio,
            verified: distillery.verified,
            isPremium: distillery.ispremium,
            websiteUrl: distillery.websiteurl,
            followersCount: distillery._count?.followers ?? 0,
            spiritsCount: officialSpiritsCount,
            poursCount: distillery._count?.pours ?? 0,
            isFollowing: !!isFollowing,
            hasOwner: !!distillery.owneruserid,
            isClaimed: distillery.isclaimed,
        };
    }
    async getPours(distilleryId, userId) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        const pours = await this.prisma.pour.findMany({
            where: {
                distilleryid: distilleryId,
                isshared: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                    },
                },
                spirit: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        bottleimage: true,
                        distillery: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
                cheers: true,
                imageFile: {
                    select: {
                        id: true,
                        ispublic: true,
                    },
                },
            },
            orderBy: {
                createdat: 'desc',
            },
        });
        const userCheers = await this.prisma.cheer.findMany({
            where: {
                userid: userId,
                pourid: { in: pours.map((p) => p.id) },
            },
            select: { pourid: true },
        });
        const cheeredPourIds = new Set(userCheers.map((c) => c.pourid));
        return pours.map((pour) => ({
            id: pour.id,
            whyItHit: pour.whyithit,
            isShared: pour.isshared,
            isDistilleryPost: pour.isdistillerypost,
            image: pour.image,
            imageFileId: pour.imageFile?.id,
            imageIsPublic: pour.imageFile?.ispublic,
            createdAt: pour.createdat,
            user: pour.user,
            spirit: pour.spirit,
            flavorTags: pour.flavortags?.map?.((ft) => ft.flavortag) ?? [],
            cheersCount: pour.cheers?.length ?? 0,
            hasCheered: cheeredPourIds.has(pour.id),
            distilleryVerified: distillery.verified,
        }));
    }
    async getSpirits(distilleryId, userId) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        const spirits = await this.prisma.spirit.findMany({
            where: {
                distilleryid: distilleryId,
                isusercreated: false,
            },
            include: {
                distillery: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                        ispremium: true,
                    },
                },
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
                radar: {
                    where: { userid: userId },
                    select: { id: true },
                },
                insight: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return spirits.map((spirit) => ({
            id: spirit.id,
            name: spirit.name,
            category: spirit.category,
            style: spirit.style,
            abv: spirit.abv ? parseFloat(spirit.abv.toString()) : null,
            region: spirit.region,
            bottleImage: spirit.bottleimage,
            officialTastingNotes: spirit.officialtastingnotes,
            distillery: spirit.distillery,
            flavorTags: spirit.flavortags.map((ft) => ft.flavortag),
            isOnRadar: spirit.radar?.length > 0,
            hasInsights: !!spirit.insight && distillery.ispremium,
            insights: distillery.ispremium && spirit.insight ? {
                howWeCreated: spirit.insight.howwecreated,
                whatMakesItSpecial: spirit.insight.whatmakesitspecial,
                tastingNotes: spirit.insight.tastingnotes,
            } : null,
        }));
    }
    async toggleFollow(distilleryId, userId) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        const existing = await this.prisma.distilleryfollower.findUnique({
            where: {
                userid_distilleryid: {
                    userid: userId,
                    distilleryid: distilleryId,
                },
            },
        });
        if (existing) {
            await this.prisma.distilleryfollower.delete({
                where: { id: existing.id },
            });
            await this.prisma.distillery.update({
                where: { id: distilleryId },
                data: {
                    followerscount: {
                        decrement: 1,
                    },
                },
            });
            return { isFollowing: false, message: 'Unfollowed distillery' };
        }
        else {
            await this.prisma.distilleryfollower.create({
                data: {
                    userid: userId,
                    distilleryid: distilleryId,
                },
            });
            await this.prisma.distillery.update({
                where: { id: distilleryId },
                data: {
                    followerscount: {
                        increment: 1,
                    },
                },
            });
            return { isFollowing: true, message: 'Following distillery' };
        }
    }
    async updateInsights(distilleryId, spiritId, userId, data) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        if (!distillery.ispremium) {
            throw new common_1.ForbiddenException('Distillery Insights are only available for premium tier (R700/month or R7,000/year)');
        }
        const spirit = await this.prisma.spirit.findFirst({
            where: {
                id: spiritId,
                distilleryid: distilleryId,
            },
        });
        if (!spirit) {
            throw new common_1.NotFoundException('Spirit not found or does not belong to this distillery');
        }
        const insight = await this.prisma.distilleryinsight.upsert({
            where: { spiritid: spiritId },
            create: {
                distilleryid: distilleryId,
                spiritid: spiritId,
                howwecreated: data.howWeCreated,
                whatmakesitspecial: data.whatMakesItSpecial,
                tastingnotes: data.tastingNotes,
            },
            update: {
                howwecreated: data.howWeCreated,
                whatmakesitspecial: data.whatMakesItSpecial,
                tastingnotes: data.tastingNotes,
            },
        });
        return {
            message: 'Distillery insights updated successfully',
            insights: {
                howWeCreated: insight.howwecreated,
                whatMakesItSpecial: insight.whatmakesitspecial,
                tastingNotes: insight.tastingnotes,
            },
        };
    }
    async getAnalytics(distilleryId, userId) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
            include: {
                _count: {
                    select: {
                        spirits: true,
                        pours: true,
                    },
                },
            },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        if (!distillery.ispremium) {
            throw new common_1.ForbiddenException('Analytics dashboard is only available for premium tier (R700/month or R7,000/year)');
        }
        const radarAdds = await this.prisma.radar.count({
            where: {
                spirit: {
                    distilleryid: distilleryId,
                },
            },
        });
        const topSpiritsOnRadar = await this.prisma.spirit.findMany({
            where: { distilleryid: distilleryId },
            select: {
                id: true,
                name: true,
                bottleimage: true,
                _count: {
                    select: { radar: true },
                },
            },
            orderBy: {
                radar: {
                    _count: 'desc',
                },
            },
            take: 5,
        });
        const flavorTagsData = await this.prisma.spiritflavortag.findMany({
            where: {
                spirit: {
                    distilleryid: distilleryId,
                },
            },
            include: {
                flavortag: true,
            },
        });
        const flavorTagCounts = flavorTagsData.reduce((acc, sft) => {
            const tagName = sft.flavortag?.name ?? 'Unknown';
            acc[tagName] = (acc[tagName] || 0) + 1;
            return acc;
        }, {});
        const topFlavorTags = Object.entries(flavorTagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyPours = await this.prisma.pour.groupBy({
            by: ['createdat'],
            where: {
                distilleryid: distilleryId,
                createdat: {
                    gte: sixMonthsAgo,
                },
            },
            _count: true,
        });
        const monthlyData = monthlyPours.reduce((acc, pour) => {
            const month = pour.createdat.toISOString().substring(0, 7);
            acc[month] = (acc[month] || 0) + pour._count;
            return acc;
        }, {});
        const monthlyGraph = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
        return {
            overview: {
                totalSpirits: distillery._count?.spirits ?? 0,
                totalFollowers: distillery.followerscount,
                totalRadarAdds: radarAdds,
                totalPours: distillery._count?.pours ?? 0,
            },
            topSpiritsOnRadar: topSpiritsOnRadar.map((s) => ({
                id: s.id,
                name: s.name,
                bottleImage: s.bottleimage,
                radarAdds: s._count?.radar ?? 0,
            })),
            topFlavorTags,
            monthlyGraph,
        };
    }
    async checkOwnership(distilleryId, userId) {
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
            select: { owneruserid: true },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        if (distillery.owneruserid !== userId) {
            throw new common_1.ForbiddenException('Only the distillery owner can perform this action');
        }
    }
    async addSpiritToShelf(distilleryId, userId, dto) {
        await this.checkOwnership(distilleryId, userId);
        const { flavorTagIds, ...spiritData } = dto;
        const spirit = await this.prisma.spirit.create({
            data: {
                name: spiritData.name,
                distilleryid: distilleryId,
                category: spiritData.category,
                style: spiritData.style,
                abv: spiritData.abv,
                region: spiritData.region,
                bottleimage: spiritData.bottleImage,
                officialtastingnotes: spiritData.officialTastingNotes,
                ...(flavorTagIds && {
                    flavortags: {
                        create: flavorTagIds.map((tagId) => ({
                            flavortagid: tagId,
                        })),
                    },
                }),
            },
            include: {
                distillery: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                    },
                },
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
        });
        return {
            id: spirit.id,
            name: spirit.name,
            category: spirit.category,
            style: spirit.style,
            abv: spirit.abv ? Number(spirit.abv) : null,
            region: spirit.region,
            bottleImage: spirit.bottleimage,
            officialTastingNotes: spirit.officialtastingnotes,
            distillery: spirit.distillery,
            flavorTags: spirit.flavortags.map((ft) => ({
                id: ft.flavortag.id,
                name: ft.flavortag.name,
            })),
            createdAt: spirit.createdat,
        };
    }
    async updateSpiritOnShelf(distilleryId, spiritId, userId, dto) {
        await this.checkOwnership(distilleryId, userId);
        const spirit = await this.prisma.spirit.findUnique({
            where: { id: spiritId },
            select: { distilleryid: true },
        });
        if (!spirit || spirit.distilleryid !== distilleryId) {
            throw new common_1.NotFoundException('Spirit not found on this distillery shelf');
        }
        const { flavorTagIds, ...spiritData } = dto;
        if (flavorTagIds !== undefined) {
            await this.prisma.spiritflavortag.deleteMany({
                where: { spiritid: spiritId },
            });
            if (flavorTagIds.length > 0) {
                await this.prisma.spiritflavortag.createMany({
                    data: flavorTagIds.map((tagId) => ({
                        spiritid: spiritId,
                        flavortagid: tagId,
                    })),
                });
            }
        }
        const updatedSpirit = await this.prisma.spirit.update({
            where: { id: spiritId },
            data: {
                ...(spiritData.name && { name: spiritData.name }),
                ...(spiritData.category !== undefined && { category: spiritData.category }),
                ...(spiritData.style !== undefined && { style: spiritData.style }),
                ...(spiritData.abv !== undefined && { abv: spiritData.abv }),
                ...(spiritData.region !== undefined && { region: spiritData.region }),
                ...(spiritData.bottleImage !== undefined && { bottleimage: spiritData.bottleImage }),
                ...(spiritData.officialTastingNotes !== undefined && {
                    officialtastingnotes: spiritData.officialTastingNotes,
                }),
            },
            include: {
                distillery: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                    },
                },
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
        });
        return {
            id: updatedSpirit.id,
            name: updatedSpirit.name,
            category: updatedSpirit.category,
            style: updatedSpirit.style,
            abv: updatedSpirit.abv ? Number(updatedSpirit.abv) : null,
            region: updatedSpirit.region,
            bottleImage: updatedSpirit.bottleimage,
            officialTastingNotes: updatedSpirit.officialtastingnotes,
            distillery: updatedSpirit.distillery,
            flavorTags: updatedSpirit.flavortags.map((ft) => ({
                id: ft.flavortag.id,
                name: ft.flavortag.name,
            })),
            createdAt: updatedSpirit.createdat,
        };
    }
    async deleteSpiritFromShelf(distilleryId, spiritId, userId) {
        await this.checkOwnership(distilleryId, userId);
        const spirit = await this.prisma.spirit.findUnique({
            where: { id: spiritId },
            select: { distilleryid: true },
        });
        if (!spirit || spirit.distilleryid !== distilleryId) {
            throw new common_1.NotFoundException('Spirit not found on this distillery shelf');
        }
        await this.prisma.spirit.delete({
            where: { id: spiritId },
        });
        return { message: 'Spirit deleted successfully' };
    }
    async updateProfile(distilleryId, userId, dto) {
        await this.checkOwnership(distilleryId, userId);
        const updatedDistillery = await this.prisma.distillery.update({
            where: { id: distilleryId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.bio !== undefined && { bio: dto.bio }),
                ...(dto.logo !== undefined && { logo: dto.logo }),
                ...(dto.heroImage !== undefined && { heroimage: dto.heroImage }),
                ...(dto.region !== undefined && { region: dto.region }),
                ...(dto.country !== undefined && { country: dto.country }),
                ...(dto.spiritTypes !== undefined && { spirittypes: dto.spiritTypes }),
            },
            select: {
                id: true,
                name: true,
                bio: true,
                logo: true,
                heroimage: true,
                region: true,
                country: true,
                spirittypes: true,
                verified: true,
            },
        });
        return {
            id: updatedDistillery.id,
            name: updatedDistillery.name,
            bio: updatedDistillery.bio,
            logo: updatedDistillery.logo,
            heroImage: updatedDistillery.heroimage,
            region: updatedDistillery.region,
            country: updatedDistillery.country,
            spiritTypes: updatedDistillery.spirittypes,
            verified: updatedDistillery.verified,
        };
    }
};
exports.DistilleriesService = DistilleriesService;
exports.DistilleriesService = DistilleriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DistilleriesService);
//# sourceMappingURL=distilleries.service.js.map