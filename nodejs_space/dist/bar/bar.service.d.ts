import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';
import { CheersService } from '../cheers/cheers.service';
export declare class BarService {
    private prisma;
    private connectionsService;
    private cheersService;
    constructor(prisma: PrismaService, connectionsService: ConnectionsService, cheersService: CheersService);
    getBarFeed(userId: string, filters: {
        category?: string;
        flavorTags?: string;
    }): Promise<{
        id: string;
        whyItHit: string;
        image: string | null;
        createdAt: Date;
        user: {
            id: string;
            name: string;
            profilePhoto: string | null;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            isOfficial: boolean;
        };
        spirit: {
            id: string;
            name: string;
            distilleryId: string | undefined;
            distilleryName: string | undefined;
            category: string | null;
            style: string | null;
            abv: number | null;
            region: string | null;
            bottleImage: string | null;
            distillery: {
                id: string | undefined;
                name: string | undefined;
                country: string | null | undefined;
                region: string | null | undefined;
            };
        };
        flavorTags: {
            id: any;
            name: any;
        }[];
        cheersCount: number | undefined;
        hasUserCheered: boolean;
    }[]>;
}
