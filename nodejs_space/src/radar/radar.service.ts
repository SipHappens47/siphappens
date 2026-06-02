import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RadarService {
  constructor(private prisma: PrismaService) {}

  // Add spirit to wishlist
  async addToRadar(userId: string, spiritId: string) {
    // Check if spirit exists
    const spirit = await this.prisma.spirit.findUnique({
      where: { id: spiritId },
    });

    if (!spirit) {
      throw new NotFoundException('Spirit not found');
    }

    // Check if already on radar
    const existing = await this.prisma.radar.findUnique({
      where: {
        userid_spiritid: {
          userid: userId,
          spiritid: spiritId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Spirit already on your radar');
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

  // Remove spirit from wishlist
  async removeFromRadar(userId: string, spiritId: string) {
    const radarEntry = await this.prisma.radar.findUnique({
      where: {
        userid_spiritid: {
          userid: userId,
          spiritid: spiritId,
        },
      },
    });

    if (!radarEntry) {
      throw new NotFoundException('Spirit not on your radar');
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

  // Get user's wishlist
  async getRadar(userId: string) {
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
        flavorTags: entry.spirit.flavortags.map((ft: any) => ({
          id: ft.flavortag.id,
          name: ft.flavortag.name,
        })),
      },
    }));
  }

  // Check if spirit is on user's radar
  async isOnRadar(userId: string, spiritId: string): Promise<boolean> {
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
}
