import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async savePushToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushtoken: token },
    });
    return { message: 'Push token saved' };
  }

  // ---- Experience level -----------------------------------------------
  // Curious: fewer than 5 pours OR fewer than 3 unique categories
  // Social:  5+ pours AND 3+ connections AND 50%+ shared pours
  // Serious: 15+ pours AND 5+ unique categories AND 3+ regions
  private async getExperienceStats(userId: string) {
    const [pours, sharedPours, connections, pourSpirits] = await Promise.all([
      this.prisma.pour.count({ where: { userid: userId } }),
      this.prisma.pour.count({ where: { userid: userId, isshared: true } }),
      this.prisma.connection.count({
        where: { status: 'Accepted', OR: [{ initiatorid: userId }, { receiverid: userId }] },
      }),
      this.prisma.pour.findMany({
        where: { userid: userId },
        select: { spirit: { select: { category: true, region: true } } },
      }),
    ]);

    const categories = new Set(
      pourSpirits.map((p) => p.spirit?.category?.trim().toLowerCase()).filter(Boolean),
    ).size;
    const regions = new Set(
      pourSpirits.map((p) => p.spirit?.region?.trim().toLowerCase()).filter(Boolean),
    ).size;
    const sharedPercent = pours > 0 ? sharedPours / pours : 0;

    return { pours, sharedPours, sharedPercent, categories, regions, connections };
  }

  private levelFromStats(s: {
    pours: number;
    sharedPercent: number;
    categories: number;
    regions: number;
    connections: number;
  }): 'Curious' | 'Social' | 'Serious' {
    if (s.pours >= 15 && s.categories >= 5 && s.regions >= 3) return 'Serious';
    if (s.pours >= 5 && s.connections >= 3 && s.sharedPercent >= 0.5) return 'Social';
    return 'Curious';
  }

  // Recalculates and persists the user's experience level. Called whenever a
  // pour is created, a connection is accepted, or a pour's shared flag changes.
  async calculateExperienceLevel(userId: string) {
    try {
      const stats = await this.getExperienceStats(userId);
      const level = this.levelFromStats(stats);
      await this.prisma.user.update({
        where: { id: userId },
        data: { experiencelevel: level },
      });
      return level;
    } catch (error) {
      // Never let level recalculation break the triggering action
      console.error('[ProfileService] calculateExperienceLevel failed:', error);
      return null;
    }
  }

  async getExperienceBreakdown(userId: string) {
    const stats = await this.getExperienceStats(userId);
    const level = this.levelFromStats(stats);

    const plural = (n: number, w: string) =>
      `${n} more ${n === 1 ? w : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's'}`;
    let nextLevel: string | null = null;
    const needs: string[] = [];

    if (level === 'Curious') {
      nextLevel = 'Social';
      if (stats.pours < 5) needs.push(plural(5 - stats.pours, 'pour'));
      if (stats.connections < 3) needs.push(plural(3 - stats.connections, 'connection'));
      if (stats.sharedPercent < 0.5) needs.push('share at least half your pours');
    } else if (level === 'Social') {
      nextLevel = 'Serious';
      if (stats.pours < 15) needs.push(plural(15 - stats.pours, 'pour'));
      if (stats.categories < 5) needs.push(plural(5 - stats.categories, 'category'));
      if (stats.regions < 3) needs.push(plural(3 - stats.regions, 'region'));
    }

    return { level, stats, nextLevel, needs };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilephoto: true,
        heroimage: true,
        bio: true,
        experiencelevel: true,
        ageverified: true,
        allowinstantfollow: true,
        createdat: true,
        owneddistillery: {
          select: {
            id: true,
            name: true,
            bio: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [poursCount, connectionsCount, cheersCount] = await Promise.all([
      this.prisma.pour.count({ where: { userid: userId } }),
      this.prisma.connection.count({
        where: { status: 'Accepted', OR: [{ initiatorid: userId }, { receiverid: userId }] },
      }),
      // Cheers received across this user's pours
      this.prisma.cheer.count({ where: { pour: { userid: userId } } }),
    ]);

    let displayName = user.name;
    let displayBio = user.bio;
    let displayPhoto = user.profilephoto;

    // For distillery accounts, use distillery name and details
    const distillery = user.owneddistillery?.[0];
    if (distillery) {
      displayName = distillery.name;
      displayBio = distillery.bio || user.bio;
      displayPhoto = distillery.logo || user.profilephoto;
    }

    return {
      id: user.id,
      email: user.email,
      name: displayName,
      profilePhoto: displayPhoto,
      heroImage: user.heroimage,
      bio: displayBio,
      experienceLevel: user.experiencelevel,
      ageVerified: user.ageverified,
      allowInstantFollow: user.allowinstantfollow,
      createdAt: user.createdat,
      poursCount,
      connectionsCount,
      cheersCount,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.profilePhoto !== undefined && { profilephoto: dto.profilePhoto }),
        ...(dto.heroImage !== undefined && { heroimage: dto.heroImage }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.experienceLevel && { experiencelevel: dto.experienceLevel }),
        ...(dto.allowInstantFollow !== undefined && { allowinstantfollow: dto.allowInstantFollow }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilephoto: true,
        bio: true,
        experiencelevel: true,
        ageverified: true,
        allowinstantfollow: true,
        createdat: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePhoto: user.profilephoto,
      bio: user.bio,
      experienceLevel: user.experiencelevel,
      ageVerified: user.ageverified,
      allowInstantFollow: user.allowinstantfollow,
      createdAt: user.createdat,
    };
  }

  async updatePhoto(userId: string, dto: UpdatePhotoDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilephoto: dto.profilePhoto,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilephoto: true,
        bio: true,
        experiencelevel: true,
        ageverified: true,
        createdat: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePhoto: user.profilephoto,
      bio: user.bio,
      experienceLevel: user.experiencelevel,
      ageVerified: user.ageverified,
      createdAt: user.createdat,
    };
  }

  async getPublicProfile(userId: string) {
    try {
      console.log('[ProfileService] Getting public profile for userId:', userId);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          profilephoto: true,
          heroimage: true,
          bio: true,
          experiencelevel: true,
          isofficial: true,
          allowinstantfollow: true,
          createdat: true,
        },
      });

      if (!user) {
        console.log('[ProfileService] User not found:', userId);
        throw new NotFoundException('User not found');
      }

      console.log('[ProfileService] User found:', user.name);

      const [poursCount, connectionsCount, cheersCount] = await Promise.all([
        this.prisma.pour.count({ where: { userid: userId, isshared: true } }),
        this.prisma.connection.count({
          where: { status: 'Accepted', OR: [{ initiatorid: userId }, { receiverid: userId }] },
        }),
        // Cheers received on this user's shared pours
        this.prisma.cheer.count({ where: { pour: { userid: userId, isshared: true } } }),
      ]);

      return {
        id: user.id,
        name: user.name,
        profilePhoto: user.profilephoto,
        heroImage: user.heroimage,
        bio: user.bio,
        experienceLevel: user.experiencelevel,
        isOfficial: user.isofficial ?? false,
        allowInstantFollow: user.allowinstantfollow ?? false,
        createdAt: user.createdat,
        poursCount,
        connectionsCount,
        cheersCount,
      };
    } catch (error) {
      console.error('[ProfileService] Error getting public profile:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('User not found');
    }
  }
}