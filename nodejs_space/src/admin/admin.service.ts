import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly ADMIN_EMAIL = 'official@siphappens.com'; // SipHappens brand account = admin

  constructor(private prisma: PrismaService) {}

  async checkAdminAccess(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || user.email !== this.ADMIN_EMAIL) {
      throw new ForbiddenException('Admin access required');
    }
  }

  async getUnverifiedDistilleries() {
    return this.prisma.distillery.findMany({
      where: { 
        verified: false,
        isclaimed: true, // Only show user-claimed distilleries
      },
      select: {
        id: true,
        name: true,
        region: true,
        country: true,
        logo: true,
        bio: true,
        spirittypes: true,
        createdat: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdat: 'desc' },
    });
  }

  async verifyDistillery(distilleryId: string, adminUserId: string) {
    await this.checkAdminAccess(adminUserId);

    const distillery = await this.prisma.distillery.findUnique({
      where: { id: distilleryId },
    });

    if (!distillery) {
      throw new NotFoundException('Distillery not found');
    }

    return this.prisma.distillery.update({
      where: { id: distilleryId },
      data: { verified: true },
      select: {
        id: true,
        name: true,
        verified: true,
      },
    });
  }

  async rejectDistillery(distilleryId: string, adminUserId: string) {
    await this.checkAdminAccess(adminUserId);

    const distillery = await this.prisma.distillery.findUnique({
      where: { id: distilleryId },
    });

    if (!distillery) {
      throw new NotFoundException('Distillery not found');
    }

    // For now, just mark as not verified (could also delete)
    return this.prisma.distillery.update({
      where: { id: distilleryId },
      data: { verified: false },
      select: {
        id: true,
        name: true,
        verified: true,
      },
    });
  }
}
