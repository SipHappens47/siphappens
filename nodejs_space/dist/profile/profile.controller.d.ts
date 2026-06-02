import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
export declare class ProfileController {
    private profileService;
    constructor(profileService: ProfileService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        ageVerified: boolean;
        createdAt: Date;
    }>;
    updatePhoto(req: any, dto: UpdatePhotoDto): Promise<{
        id: string;
        email: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        ageVerified: boolean;
        createdAt: Date;
    }>;
}
