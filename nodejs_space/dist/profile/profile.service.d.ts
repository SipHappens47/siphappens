import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
export declare class ProfileService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        ageVerified: boolean;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        ageVerified: boolean;
        createdAt: Date;
    }>;
    updatePhoto(userId: string, dto: UpdatePhotoDto): Promise<{
        id: string;
        email: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        ageVerified: boolean;
        createdAt: Date;
    }>;
    getPublicProfile(userId: string): Promise<{
        id: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        isOfficial: boolean;
        createdAt: Date;
    }>;
}
