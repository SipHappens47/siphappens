import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePourDto } from './dto/create-pour.dto';
import { UpdatePourDto } from './dto/update-pour.dto';
import { BadgesService } from '../badges/badges.service';

@Injectable()
export class PoursService {
  constructor(
    private prisma: PrismaService,
    private badgesService: BadgesService,
  ) {}

  async createPour(userId: string, dto: CreatePourDto) {
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

    // Check and unlock badges after creating pour
    await this.badgesService.checkAndUnlockBadges(userId);

    return this.formatPourResponse(pour);
  }

  async getPours(
    userId: string,
    filters: {
      category?: string;
      flavorTags?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const where: any = {
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

  async getPour(userId: string, id: string) {
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
      throw new NotFoundException('Pour not found');
    }

    // Allow access if user is the owner OR the pour is shared
    if (pour.userid !== userId && !pour.isshared) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatPourResponse(pour);
  }

  async updatePour(userId: string, id: string, dto: UpdatePourDto) {
    const existingPour = await this.prisma.pour.findUnique({ where: { id } });

    if (!existingPour) {
      throw new NotFoundException('Pour not found');
    }

    if (existingPour.userid !== userId) {
      throw new ForbiddenException('Access denied');
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

    // Check and unlock badges after updating pour
    await this.badgesService.checkAndUnlockBadges(userId);

    return this.formatPourResponse(pour);
  }

  async deletePour(userId: string, id: string) {
    const pour = await this.prisma.pour.findUnique({ where: { id } });

    if (!pour) {
      throw new NotFoundException('Pour not found');
    }

    if (pour.userid !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.pour.delete({ where: { id } });

    return { message: 'Pour deleted successfully' };
  }

  async getUserPublicPours(userId: string) {
    const pours = await this.prisma.pour.findMany({
      where: {
        userid: userId,
        isshared: true, // Only shared pours (posted to The Bar)
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

  private formatPourResponse(pour: any) {
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
          ? pour.spirit.flavortags.map((ft: any) => ({
              id: ft.flavortag.id,
              name: ft.flavortag.name,
            }))
          : undefined,
      },
      flavorTags: pour.flavortags.map((ft: any) => ({
        id: ft.flavortag.id,
        name: ft.flavortag.name,
      })),
    };
  }
}