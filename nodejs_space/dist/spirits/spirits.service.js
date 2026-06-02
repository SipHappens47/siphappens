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
var SpiritsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpiritsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SpiritsService = SpiritsService_1 = class SpiritsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SpiritsService_1.name);
    }
    normalizeRegion(region) {
        if (!region)
            return '';
        const parts = region.split(',').map(p => p.trim());
        if (parts.length > 1) {
            return parts[parts.length - 1];
        }
        return region;
    }
    async recognizeBottle(dto) {
        try {
            const { image } = dto;
            let base64Image = image;
            if (image.startsWith('data:image')) {
                base64Image = image.split(',')[1];
            }
            const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Analyze this spirit bottle image and extract the following information. Return your response in JSON format with the following structure: {"matches": [{"spiritName": "", "distilleryName": "", "category": "", "style": "", "abv": 0, "region": "", "confidence": 0.95}]}. If you can identify the spirit with high confidence, return 1 match. If uncertain, return up to 3 possible matches with different confidence scores. Categories should be: Whisky, Bourbon, Scotch, Rum, Vodka, Gin, Tequila, Cognac, Brandy, or Other.',
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`,
                                    },
                                },
                            ],
                        },
                    ],
                    response_format: { type: 'json_object' },
                    stream: false,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error('LLM API error:', errorText);
                throw new Error('Failed to analyze bottle image');
            }
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No response from AI');
            }
            const result = JSON.parse(content);
            return result;
        }
        catch (error) {
            this.logger.error('Bottle recognition error:', error);
            throw error;
        }
    }
    async createSpirit(dto) {
        const { flavorTagIds, ...spiritData } = dto;
        const spirit = await this.prisma.spirit.create({
            data: {
                name: spiritData.name?.trim(),
                isusercreated: true,
                ...(spiritData.distilleryId && { distilleryid: spiritData.distilleryId }),
                ...(spiritData.category && { category: spiritData.category.trim() }),
                ...(spiritData.style && { style: spiritData.style.trim() }),
                ...(spiritData.abv && { abv: spiritData.abv }),
                ...(spiritData.region && { region: this.normalizeRegion(spiritData.region) }),
                ...(spiritData.bottleImage && { bottleimage: spiritData.bottleImage }),
                ...(flavorTagIds && {
                    flavortags: {
                        create: flavorTagIds.map((tagId) => ({
                            flavortagid: tagId,
                        })),
                    },
                }),
            },
            include: {
                distillery: true,
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
        });
        return this.formatSpiritResponse(spirit);
    }
    async getSpirit(id) {
        const spirit = await this.prisma.spirit.findUnique({
            where: { id },
            include: {
                distillery: true,
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
        });
        if (!spirit) {
            throw new common_1.NotFoundException('Spirit not found');
        }
        return this.formatSpiritResponse(spirit);
    }
    async updateSpirit(id, dto) {
        const { flavorTagIds, ...spiritData } = dto;
        const spirit = await this.prisma.spirit.findUnique({ where: { id } });
        if (!spirit) {
            throw new common_1.NotFoundException('Spirit not found');
        }
        if (flavorTagIds !== undefined) {
            await this.prisma.spiritflavortag.deleteMany({
                where: { spiritid: id },
            });
        }
        const updated = await this.prisma.spirit.update({
            where: { id },
            data: {
                ...(spiritData.name && { name: spiritData.name.trim() }),
                ...(spiritData.distilleryId && { distilleryid: spiritData.distilleryId }),
                ...(spiritData.category && { category: spiritData.category.trim() }),
                ...(spiritData.style && { style: spiritData.style.trim() }),
                ...(spiritData.abv !== undefined && { abv: spiritData.abv }),
                ...(spiritData.region && { region: this.normalizeRegion(spiritData.region) }),
                ...(spiritData.bottleImage && { bottleimage: spiritData.bottleImage }),
                ...(flavorTagIds && {
                    flavortags: {
                        create: flavorTagIds.map((tagId) => ({
                            flavortagid: tagId,
                        })),
                    },
                }),
            },
            include: {
                distillery: true,
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
        });
        return this.formatSpiritResponse(updated);
    }
    async searchSpirits(query) {
        const spirits = await this.prisma.spirit.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { distillery: { name: { contains: query, mode: 'insensitive' } } },
                    { category: { contains: query, mode: 'insensitive' } },
                    { style: { contains: query, mode: 'insensitive' } },
                    { region: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: {
                distillery: true,
                flavortags: {
                    include: {
                        flavortag: true,
                    },
                },
            },
            take: 20,
        });
        return spirits.map((spirit) => this.formatSpiritResponse(spirit));
    }
    async createDistillery(dto) {
        return this.prisma.distillery.create({
            data: {
                name: dto.name?.trim(),
                ...(dto.country && { country: dto.country.trim() }),
                ...(dto.region && { region: this.normalizeRegion(dto.region) }),
            },
        });
    }
    async searchDistilleries(query) {
        return this.prisma.distillery.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
            },
            take: 20,
        });
    }
    async searchBottleImages(query) {
        this.logger.log(`Image search requested for: ${query}`);
        this.logger.warn('Image search not yet implemented - returning empty results');
        return { images: [] };
    }
    formatSpiritResponse(spirit) {
        return {
            id: spirit.id,
            name: spirit.name,
            category: spirit.category,
            style: spirit.style,
            abv: spirit.abv ? parseFloat(spirit.abv.toString()) : null,
            region: spirit.region,
            bottleImage: spirit.bottleimage,
            createdAt: spirit.createdat,
            distillery: {
                id: spirit.distillery.id,
                name: spirit.distillery.name,
                country: spirit.distillery.country,
                region: spirit.distillery.region,
            },
            flavorTags: spirit.flavortags.map((ft) => ({
                id: ft.flavortag.id,
                name: ft.flavortag.name,
            })),
        };
    }
};
exports.SpiritsService = SpiritsService;
exports.SpiritsService = SpiritsService = SpiritsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpiritsService);
//# sourceMappingURL=spirits.service.js.map