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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async universalSearch(query, currentUserId) {
        if (!query || query.trim().length < 2) {
            return {
                users: [],
                spirits: [],
                distilleries: [],
                flavorTags: [],
                categories: [],
                locations: [],
                reviews: [],
            };
        }
        const searchTerm = query.trim().toLowerCase();
        const spirits = await this.searchSpirits(searchTerm);
        const users = await this.searchUsers(searchTerm, currentUserId);
        const distilleries = await this.searchDistilleries(searchTerm);
        const flavorTags = await this.searchFlavorTags(searchTerm);
        const categories = await this.searchCategories(searchTerm);
        const locations = await this.searchLocations(searchTerm);
        const reviews = await this.searchReviews(searchTerm, currentUserId);
        return {
            users,
            spirits,
            distilleries,
            flavorTags,
            categories,
            locations,
            reviews,
        };
    }
    async searchUsers(searchTerm, currentUserId) {
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { email: { contains: searchTerm, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilephoto: true,
                experiencelevel: true,
                isofficial: true,
            },
            take: 5,
        });
        return users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            profilePhoto: user.profilephoto,
            experienceLevel: user.experiencelevel,
            isOfficial: user.isofficial ?? false,
            type: 'user',
        }));
    }
    async searchSpirits(searchTerm) {
        const spirits = await this.prisma.spirit.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { category: { contains: searchTerm, mode: 'insensitive' } },
                    { style: { contains: searchTerm, mode: 'insensitive' } },
                    { region: { contains: searchTerm, mode: 'insensitive' } },
                    {
                        distillery: {
                            name: { contains: searchTerm, mode: 'insensitive' },
                        },
                    },
                ],
            },
            include: {
                distillery: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                        region: true,
                    },
                },
            },
            take: 5,
        });
        return spirits.map((spirit) => ({
            id: spirit.id,
            name: spirit.name,
            category: spirit.category,
            style: spirit.style,
            abv: spirit.abv ? parseFloat(spirit.abv.toString()) : null,
            region: spirit.region,
            bottleImage: spirit.bottleimage,
            distillery: spirit.distillery ? {
                id: spirit.distillery.id,
                name: spirit.distillery.name,
                country: spirit.distillery.country,
                region: spirit.distillery.region,
            } : null,
            type: 'spirit',
        }));
    }
    async searchDistilleries(searchTerm) {
        const distilleries = await this.prisma.distillery.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { country: { contains: searchTerm, mode: 'insensitive' } },
                    { region: { contains: searchTerm, mode: 'insensitive' } },
                ],
            },
            include: {
                _count: {
                    select: { spirits: true },
                },
            },
            take: 5,
        });
        return distilleries.map((distillery) => ({
            id: distillery.id,
            name: distillery.name,
            country: distillery.country,
            region: distillery.region,
            spiritsCount: distillery._count.spirits,
            type: 'distillery',
        }));
    }
    async searchFlavorTags(searchTerm) {
        const tags = await this.prisma.flavortag.findMany({
            where: {
                name: { contains: searchTerm, mode: 'insensitive' },
            },
            include: {
                _count: {
                    select: { spirits: true, pours: true },
                },
            },
            take: 5,
        });
        return tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            spiritsCount: tag._count.spirits,
            poursCount: tag._count.pours,
            type: 'flavorTag',
        }));
    }
    async searchCategories(searchTerm) {
        const spirits = await this.prisma.spirit.findMany({
            where: {
                category: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            select: {
                category: true,
            },
            distinct: ['category'],
            take: 5,
        });
        const categories = await Promise.all(spirits
            .filter((s) => s.category)
            .map(async (spirit) => {
            const count = await this.prisma.spirit.count({
                where: { category: spirit.category },
            });
            return {
                name: spirit.category,
                spiritsCount: count,
                type: 'category',
            };
        }));
        return categories;
    }
    async searchLocations(searchTerm) {
        const [spiritRegions, distilleryLocations] = await Promise.all([
            this.prisma.spirit.findMany({
                where: {
                    region: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                select: { region: true },
                distinct: ['region'],
                take: 3,
            }),
            this.prisma.distillery.findMany({
                where: {
                    OR: [
                        { country: { contains: searchTerm, mode: 'insensitive' } },
                        { region: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: { country: true, region: true },
                take: 5,
            }),
        ]);
        const locationSet = new Set();
        const locations = [];
        spiritRegions.forEach((spirit) => {
            if (spirit.region && !locationSet.has(spirit.region)) {
                locationSet.add(spirit.region);
                locations.push({
                    name: spirit.region,
                    type: 'location',
                });
            }
        });
        distilleryLocations.forEach((distillery) => {
            if (distillery.country && !locationSet.has(distillery.country)) {
                locationSet.add(distillery.country);
                locations.push({
                    name: distillery.country,
                    type: 'location',
                });
            }
            if (distillery.region && !locationSet.has(distillery.region)) {
                locationSet.add(distillery.region);
                locations.push({
                    name: distillery.region,
                    type: 'location',
                });
            }
        });
        return locations.slice(0, 5);
    }
    async searchReviews(searchTerm, currentUserId) {
        const pours = await this.prisma.pour.findMany({
            where: {
                AND: [
                    { whyithit: { contains: searchTerm, mode: 'insensitive' } },
                    {
                        OR: [
                            { isshared: true },
                            { userid: currentUserId },
                        ],
                    },
                ],
            },
            include: {
                spirit: {
                    select: {
                        id: true,
                        name: true,
                        bottleimage: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        profilephoto: true,
                    },
                },
            },
            orderBy: {
                createdat: 'desc',
            },
            take: 5,
        });
        return pours.map((pour) => ({
            id: pour.id,
            whyItHit: pour.whyithit,
            preview: this.createReviewPreview(pour.whyithit, searchTerm),
            spirit: {
                id: pour.spirit.id,
                name: pour.spirit.name,
                bottleImage: pour.spirit.bottleimage,
            },
            user: {
                id: pour.user.id,
                name: pour.user.name,
                profilePhoto: pour.user.profilephoto,
            },
            createdAt: pour.createdat,
            type: 'review',
        }));
    }
    createReviewPreview(text, searchTerm) {
        const lowerText = text.toLowerCase();
        const lowerTerm = searchTerm.toLowerCase();
        const index = lowerText.indexOf(lowerTerm);
        if (index === -1) {
            return text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }
        const start = Math.max(0, index - 40);
        const end = Math.min(text.length, index + searchTerm.length + 40);
        let preview = text.substring(start, end);
        if (start > 0)
            preview = '...' + preview;
        if (end < text.length)
            preview = preview + '...';
        return preview;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map