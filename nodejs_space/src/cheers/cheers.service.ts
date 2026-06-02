import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class CheersService {
  constructor(
    private prisma: PrismaService,
    private connectionsService: ConnectionsService,
  ) {}

  // Add a cheer to a pour
  async addCheer(userId: string, pourId: string) {
    // Check if pour exists and is shared
    const pour = await this.prisma.pour.findUnique({
      where: { id: pourId },
      include: { user: true },
    });

    if (!pour) {
      throw new NotFoundException('Pour not found');
    }

    if (!pour.isshared) {
      throw new ForbiddenException('Cannot cheer a private pour');
    }

    // Check if users are connected (Fellow Sippers only)
    if (pour.userid !== userId) {
      const areConnected = await this.connectionsService.areConnected(userId, pour.userid);
      if (!areConnected) {
        throw new ForbiddenException('Can only cheer pours from Fellow Sippers');
      }
    }

    // Check if already cheered
    const existingCheer = await this.prisma.cheer.findUnique({
      where: {
        userid_pourid: {
          userid: userId,
          pourid: pourId,
        },
      },
    });

    if (existingCheer) {
      throw new BadRequestException('Already cheered this pour');
    }

    // Add cheer
    const cheer = await this.prisma.cheer.create({
      data: {
        userid: userId,
        pourid: pourId,
      },
    });

    return {
      id: cheer.id,
      createdAt: cheer.createdat,
    };
  }

  // Remove a cheer
  async removeCheer(userId: string, pourId: string) {
    const cheer = await this.prisma.cheer.findUnique({
      where: {
        userid_pourid: {
          userid: userId,
          pourid: pourId,
        },
      },
    });

    if (!cheer) {
      throw new NotFoundException('Cheer not found');
    }

    await this.prisma.cheer.delete({
      where: {
        userid_pourid: {
          userid: userId,
          pourid: pourId,
        },
      },
    });

    return { message: 'Cheer removed' };
  }

  // Get cheers count for a pour (optional, subtle display)
  async getCheersCount(pourId: string): Promise<number> {
    return this.prisma.cheer.count({
      where: { pourid: pourId },
    });
  }

  // Check if user has cheered a pour
  async hasUserCheered(userId: string, pourId: string): Promise<boolean> {
    const cheer = await this.prisma.cheer.findUnique({
      where: {
        userid_pourid: {
          userid: userId,
          pourid: pourId,
        },
      },
    });

    return !!cheer;
  }
}
