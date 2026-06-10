import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilephoto: true,
        bio: true,
        experiencelevel: true,
        ageverified: true,
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
      bio: displayBio,
      experienceLevel: user.experiencelevel,
      ageVerified: user.ageverified,
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
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.experienceLevel && { experiencelevel: dto.experienceLevel }),
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
          bio: true,
          experiencelevel: true,
          isofficial: true,
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
        bio: user.bio,
        experienceLevel: user.experiencelevel,
        isOfficial: user.isofficial ?? false,
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