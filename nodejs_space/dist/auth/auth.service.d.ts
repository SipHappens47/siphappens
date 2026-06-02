import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    signup(signupDto: SignupDto): Promise<{
        user: {
            id: string;
            email: string;
            name: any;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            distilleryId: any;
            isDistilleryAccount: boolean;
            profilePhoto: any;
            bio: any;
        };
        token: string;
        distillery: {
            id: any;
            name: any;
            verified: any;
            logo: any;
            heroImage: any;
        } | null;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            distilleryId: string;
            isDistilleryAccount: boolean;
            profilePhoto: string | null;
            bio: string | null;
        };
        token: string;
        distillery: {
            id: string;
            name: string;
            verified: boolean;
            logo: string | null;
            heroImage: string | null;
        } | null;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        profilePhoto: string | null;
        bio: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        ageVerified: boolean;
        createdAt: Date;
        distilleryId: string;
        isDistilleryAccount: boolean;
        distillery: {
            id: string;
            name: string;
            verified: boolean;
            logo: string | null;
            heroImage: string | null;
            bio: string | null;
            region: string | null;
            country: string | null;
        } | null;
    }>;
    private generateToken;
}
