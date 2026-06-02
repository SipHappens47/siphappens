import { BarService } from './bar.service';
export declare class BarController {
    private barService;
    constructor(barService: BarService);
    getBarFeed(req: any, category?: string, flavorTags?: string): Promise<{
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
