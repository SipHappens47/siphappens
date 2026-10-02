import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// SipHappens brand account = admin. Reserved at signup (see AuthService).
export const ADMIN_EMAIL = 'official@siphappens.com';

// Self-registration with the admin email is refused unless this env flag is
// 'true', so nobody can claim admin by signing up first. Existing accounts are unaffected.
export function isReservedAdminSignup(email: string | undefined): boolean {
  return (
    (email ?? '').trim().toLowerCase() === ADMIN_EMAIL &&
    process.env.ALLOW_ADMIN_SIGNUP !== 'true'
  );
}

@Injectable()
export class AdminService {
  private readonly ADMIN_EMAIL = ADMIN_EMAIL;

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
        owneruserid: { not: null }, // A claim without an owner account isn't verifiable
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
