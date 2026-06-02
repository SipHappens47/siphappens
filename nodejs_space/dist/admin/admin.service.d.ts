import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    private readonly ADMIN_EMAIL;
    constructor(prisma: PrismaService);
    checkAdminAccess(userId: string): Promise<void>;
    getUnverifiedDistilleries(): Promise<{
        region: string | null;
        country: string | null;
        bio: string | null;
        logo: string | null;
        name: string;
        id: string;
        createdat: Date;
        spirittypes: string | null;
        owner: {
            email: string;
            name: string;
            id: string;
        } | null;
    }[]>;
    verifyDistillery(distilleryId: string, adminUserId: string): Promise<{
        name: string;
        id: string;
        verified: boolean;
    }>;
    rejectDistillery(distilleryId: string, adminUserId: string): Promise<{
        name: string;
        id: string;
        verified: boolean;
    }>;
}
