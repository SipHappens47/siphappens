import { Injectable, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
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

  // Per-user daily cap on AI scans so a single account can't exhaust the shared
  // Gemini quota for everyone. Counts attempts (not just successes) to prevent
  // retry-spam. Configurable via SCAN_DAILY_LIMIT (default 30).
  private async enforceScanQuota(userId: string) {
    const limit = parseInt(process.env.SCAN_DAILY_LIMIT || '30', 10);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyscancount: true, dailyscandate: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const usedToday = user.dailyscandate === today ? user.dailyscancount : 0;
    if (usedToday >= limit) {
      throw new HttpException(
        `Daily scan limit of ${limit} reached. Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyscancount: usedToday + 1, dailyscandate: today },
    });
  }

  async recognizeBottle(userId: string, dto: RecognizeBottleDto) {
    await this.enforceScanQuota(userId);
    try {
      const { image } = dto;

      let base64Image = image;
      if (image.startsWith('data:image')) {
        base64Image = image.split(',')[1];
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        this.logger.error('GEMINI_API_KEY is not set');
        throw new Error('Bottle recognition is not configured');
      }
      // Each model has its own free-tier daily quota, so falling back to a
      // second model when the first is exhausted doubles the free scans.
      const models = [
        (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
        (process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite').trim(),
      ];

      const prompt =
        'You are identifying a bottle of spirits from a photo. Respond ONLY with JSON of the form ' +
        '{"matches":[{"spiritName":"","distilleryName":"","category":"","style":"","abv":0,"region":"","confidence":0.0}]}. ' +
        'Read the label and identify the spirit. If you are confident, return exactly 1 match; if unsure, return up to 3 ' +
        'possible matches ranked by a confidence score between 0 and 1. ' +
        'category must be one of: Whiskey, Vodka, Rum, Gin, Tequila, Mezcal, Brandy, Liqueur. ' +
        'abv is the percentage as a number (e.g. 40). ' +
        'If the image is not a spirit bottle or you cannot identify it, return {"matches":[]}.';

      // Google Gemini (generativelanguage API). Provider isolated to this method so it can be swapped.
      const reqBody = JSON.stringify({
        contents: [
          { parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64Image } }] },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      });

      // Per model: retry transient 503s briefly, then move to the next model.
      // Quota errors (429) skip straight to the next model — they won't clear
      // by waiting a few seconds.
      const attemptsPerModel = 2;
      let data: any = null;
      let lastError = '';
      outer: for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody,
          });
          if (response.ok) {
            data = await response.json();
            break outer;
          }
          lastError = await response.text();
          if (response.status === 429) {
            this.logger.warn(`Gemini ${model} quota hit (429), trying next model`);
            break; // next model
          }
          if ((response.status === 503 || response.status >= 500) && attempt < attemptsPerModel) {
            this.logger.warn(`Gemini ${model} ${response.status}, retrying (${attempt}/${attemptsPerModel})`);
            await new Promise((r) => setTimeout(r, attempt * 1500));
            continue;
          }
          this.logger.warn(`Gemini ${model} failed (${response.status}), trying next model`);
          break; // next model
        }
      }

      if (!data) {
        this.logger.error('Gemini API error (all models):', lastError);
        throw new Error('Failed to analyze bottle image');
      }

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

    // Dedupe: if this spirit already exists for the same distillery, reuse it
    // instead of creating a duplicate entry.
    if (spiritData.name?.trim() && spiritData.distilleryId) {
      const existing = await this.prisma.spirit.findFirst({
        where: {
          distilleryid: spiritData.distilleryId,
          name: { equals: spiritData.name.trim(), mode: 'insensitive' },
        },
        include: {
          distillery: true,
          flavortags: { include: { flavortag: true } },
        },
      });
      if (existing) {
        return this.formatSpiritResponse(existing);
      }
    }

    const spirit = await this.prisma.spirit.create({
      data: {
        name: spiritData.name?.trim(),
        // First time this spirit enters the catalog: list it on the distillery's
        // shelf too (shelf shows isusercreated=false spirits only).
        isusercreated: false,
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

  // Resolve an AI-identified bottle to a catalog spirit. Matching is fuzzy in
  // both directions ("Rhum Tipo Tinto" should find "Tipo Tinto" and vice
  // versa), preferring exact names, matching distilleries and closer lengths.
  async resolveSpirit(name: string, distilleryName: string | undefined, requestingUserId?: string) {
    const query = name?.trim();
    if (!query) return { found: false };

    const rows: { id: string }[] = await this.prisma.$queryRaw`
      SELECT s.id
      FROM public.spirit s
      LEFT JOIN public.distillery d ON s.distilleryid = d.id
      WHERE lower(s.name) = lower(${query})
         OR s.name ILIKE '%' || ${query} || '%'
         OR ${query} ILIKE '%' || s.name || '%'
      ORDER BY
        (lower(s.name) = lower(${query})) DESC,
        (d.name IS NOT NULL AND lower(d.name) = lower(${distilleryName ?? ''})) DESC,
        abs(length(s.name) - length(${query})) ASC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { found: false };
    }
    const spirit = await this.getSpirit(rows[0].id, requestingUserId);
    return { found: true, spirit };
  }

  async getSpirit(id: string, requestingUserId?: string) {
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

    // Community stats for the Explore flow
    const [totalPourCount, ratingAgg] = await Promise.all([
      this.prisma.pour.count({ where: { spiritid: id } }),
      this.prisma.pour.aggregate({
        where: { spiritid: id, rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    // Fellow Sippers of the requesting user who have poured this spirit
    let fellowSipperPours: { userId: string; userName: string; profilePhoto: string | null }[] = [];
    if (requestingUserId) {
      const connections = await this.prisma.connection.findMany({
        where: {
          status: 'Accepted',
          OR: [{ initiatorid: requestingUserId }, { receiverid: requestingUserId }],
        },
        select: { initiatorid: true, receiverid: true },
      });
      const friendIds = connections.map((c) =>
        c.initiatorid === requestingUserId ? c.receiverid : c.initiatorid,
      );
      if (friendIds.length > 0) {
        const friendPours = await this.prisma.pour.findMany({
          where: { spiritid: id, userid: { in: friendIds } },
          select: { user: { select: { id: true, name: true, profilephoto: true } } },
          distinct: ['userid'],
        });
        fellowSipperPours = friendPours.map((p) => ({
          userId: p.user.id,
          userName: p.user.name,
          profilePhoto: p.user.profilephoto,
        }));
      }
    }

    return {
      ...this.formatSpiritResponse(spirit),
      totalPourCount,
      averageRating:
        ratingAgg._avg.rating != null ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
      fellowSipperPours,
    };
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

  // Total pours of a spirit across all users (shown on radar cards)
  async getPourCount(spiritId: string) {
    const count = await this.prisma.pour.count({
      where: { spiritid: spiritId },
    });
    return { spiritId, pourCount: count };
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
      officialTastingNotes: spirit.officialtastingnotes,
      createdAt: spirit.createdat,
      distilleryId: spirit.distillery?.id,
      distilleryName: spirit.distillery?.name,
      distillery: spirit.distillery
        ? {
            id: spirit.distillery.id,
            name: spirit.distillery.name,
            country: spirit.distillery.country,
            region: spirit.distillery.region,
          }
        : null,
      flavorTags: (spirit.flavortags ?? []).map((ft: any) => ({
        id: ft.flavortag.id,
        name: ft.flavortag.name,
      })),
    };
  }
}