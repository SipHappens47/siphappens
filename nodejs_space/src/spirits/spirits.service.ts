import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecognizeBottleDto } from './dto/recognize-bottle.dto';
import { CreateSpiritDto } from './dto/create-spirit.dto';
import { UpdateSpiritDto } from './dto/update-spirit.dto';
import { CreateDistilleryDto } from './dto/create-distillery.dto';

@Injectable()
export class SpiritsService {
  private readonly logger = new Logger(SpiritsService.name);

  constructor(private prisma: PrismaService) {}

  // Normalize region to country only (e.g., "Swartland, South Africa" -> "South Africa")
  private normalizeRegion(region: string): string {
    if (!region) return '';
    const parts = region.split(',').map(p => p.trim());
    if (parts.length > 1) {
      return parts[parts.length - 1]; // Return last part (country)
    }
    return region;
  }

  async recognizeBottle(dto: RecognizeBottleDto) {
    try {
      const { image } = dto;

      let base64Image = image;
      if (image.startsWith('data:image')) {
        base64Image = image.split(',')[1];
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        this.logger.error('GEMINI_API_KEY is not set');
        throw new Error('Bottle recognition is not configured');
      }
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const prompt =
        'You are identifying a bottle of spirits from a photo. Respond ONLY with JSON of the form ' +
        '{"matches":[{"spiritName":"","distilleryName":"","category":"","style":"","abv":0,"region":"","confidence":0.0}]}. ' +
        'Read the label and identify the spirit. If you are confident, return exactly 1 match; if unsure, return up to 3 ' +
        'possible matches ranked by a confidence score between 0 and 1. ' +
        'category must be one of: Whiskey, Vodka, Rum, Gin, Tequila, Mezcal, Brandy, Liqueur. ' +
        'abv is the percentage as a number (e.g. 40). ' +
        'If the image is not a spirit bottle or you cannot identify it, return {"matches":[]}.';

      // Google Gemini (generativelanguage API). Provider isolated to this method so it can be swapped.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64Image } }] },
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Gemini API error:', errorText);
        throw new Error('Failed to analyze bottle image');
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No response from AI');
      }

      const result = JSON.parse(content);
      return result;
    } catch (error) {
      this.logger.error('Bottle recognition error:', error);
      throw error;
    }
  }

  async createSpirit(dto: CreateSpiritDto) {
    const { flavorTagIds, ...spiritData } = dto;

    const spirit = await this.prisma.spirit.create({
      data: {
        name: spiritData.name?.trim(),
        isusercreated: true, // User-created spirit - NEVER appears on distillery shelf
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

  async getSpirit(id: string) {
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
      throw new NotFoundException('Spirit not found');
    }

    return this.formatSpiritResponse(spirit);
  }

  async updateSpirit(id: string, dto: UpdateSpiritDto) {
    const { flavorTagIds, ...spiritData } = dto;

    const spirit = await this.prisma.spirit.findUnique({ where: { id } });
    if (!spirit) {
      throw new NotFoundException('Spirit not found');
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

  async searchSpirits(query: string) {
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

  async createDistillery(dto: CreateDistilleryDto) {
    return this.prisma.distillery.create({
      data: {
        name: dto.name?.trim(),
        ...(dto.country && { country: dto.country.trim() }),
        ...(dto.region && { region: this.normalizeRegion(dto.region) }),
      },
    });
  }

  async searchDistilleries(query: string) {
    return this.prisma.distillery.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: 20,
    });
  }

  async searchBottleImages(query: string) {
    // TODO: Integrate with image search API (Unsplash, Pexels, or Google Custom Search)
    // Current limitation: Image search is not yet implemented
    // Returning empty array to avoid showing incorrect bottle images
    this.logger.log(`Image search requested for: ${query}`);
    this.logger.warn('Image search not yet implemented - returning empty results');
    
    // Until proper image search API is integrated, return empty array
    // Users will need to skip this step or manually upload their own bottle photo
    return { images: [] };
  }

  private formatSpiritResponse(spirit: any) {
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
      flavorTags: spirit.flavortags.map((ft: any) => ({
        id: ft.flavortag.id,
        name: ft.flavortag.name,
      })),
    };
  }
}