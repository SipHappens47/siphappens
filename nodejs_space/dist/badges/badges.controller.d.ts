import { BadgesService } from './badges.service';
export declare class BadgesController {
    private readonly badgesService;
    constructor(badgesService: BadgesService);
    getMyBadges(req: any): Promise<any[]>;
    getTasteSummary(req: any): Promise<{
        flavorCount: number;
        regionCount: number;
        distilleryCount: number;
        maxFlavors: number;
        flavorDistribution: any[];
        regions: {
            name: string;
            count: number;
        }[];
    }>;
    getUserBadges(userId: string): Promise<any[]>;
    getUserTasteSummary(userId: string): Promise<{
        flavorCount: number;
        regionCount: number;
        distilleryCount: number;
        maxFlavors: number;
        flavorDistribution: any[];
        regions: {
            name: string;
            count: number;
        }[];
    }>;
}
