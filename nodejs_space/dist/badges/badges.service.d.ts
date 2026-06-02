import { PrismaService } from '../prisma/prisma.service';
export declare class BadgesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private normalizeRegion;
    getUserBadgesWithProgress(userId: string): Promise<any[]>;
    private calculateBadgeProgress;
    private calculateFlavorProgress;
    private calculateRegionProgress;
    private calculateCategoryStyleProgress;
    private calculateDistilleryProgress;
    private calculateHiddenGemProgress;
    private calculateMaturationProgress;
    private calculateProofBandsProgress;
    private calculateBotanicalProgress;
    private calculateHeritageProgress;
    private calculateContrastProgress;
    private calculateUnderdogProgress;
    private getNextTier;
    checkAndUnlockBadges(userId: string): Promise<void>;
    private unlockBadge;
    getTasteSummary(userId: string): Promise<{
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
