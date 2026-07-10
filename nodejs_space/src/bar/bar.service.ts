import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';
import { CheersService } from '../cheers/cheers.service';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class BarService {
  constructor(
    private prisma: PrismaService,
    private connectionsService: ConnectionsService,
    private cheersService: CheersService,
    private moderationService: ModerationService,
  ) {}

  async getBarFeed(
    userId: string,
    filters: {
      category?: string;
      flavorTags?: string;
    },
  ) {
    // Get user's accepted connections (including mute status)
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

    // Extract Fellow Sipper IDs, excluding muted connections
    const fellowSipperIds = connections
      .filter((conn) => !conn.ismuted)
      .map((conn) =>
        conn.initiatorid === userId ? conn.receiverid : conn.initiatorid,
      );

    // Hide content from users this user has blocked (or who blocked them).
    const hiddenUserIds = await this.moderationService.getHiddenUserIds(userId);

    // Build filter conditions
    const where: any = {
      isshared: true,
    };

    // Show the user's own shared pours alongside their Fellow Sippers'.
    // With no connections yet, show all shared pours (including their own).
    if (fellowSipperIds.length > 0) {
      const visibleIds = [...fellowSipperIds, userId].filter(
        (id) => !hiddenUserIds.includes(id),
      );
      where.userid = { in: visibleIds };
    } else if (hiddenUserIds.length > 0) {
      where.userid = { notIn: hiddenUserIds };
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

    // Get shared pours from Fellow Sippers
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

    // Format response with cheer info
    const formatted = await Promise.all(
      pours.map(async (pour) => {
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
          flavorTags: pour.flavortags.map((ft: any) => ({
            id: ft.flavortag.id,
            name: ft.flavortag.name,
          })),
          cheersCount: cheersCount > 0 ? cheersCount : undefined,
          hasUserCheered,
        };
      }),
    );

    return formatted;
  }
}
