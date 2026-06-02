import { PrismaService } from '../prisma/prisma.service';
export declare class DistilleriesService {
    private prisma;
    constructor(prisma: PrismaService);
    discover(userId: string): Promise<{
        mapPins: {
            id: string;
            name: string;
            country: string | null;
            region: string | null;
            latitude: number | null;
            longitude: number | null;
            logo: string | null;
            heroImage: string | null;
            verified: boolean;
            isClaimed: boolean;
            isFollowing: boolean;
        }[];
    }>;
    search(searchTerm: string, userId: string): Promise<{
        id: string;
        name: string;
        country: string | null;
        region: string | null;
        logo: string | null;
        heroImage: string | null;
        verified: boolean;
        isClaimed: boolean;
        isPremium: boolean;
        followersCount: number;
        latitude: number | null;
        longitude: number | null;
        isFollowing: boolean;
    }[]>;
    getProfile(distilleryId: string, userId: string): Promise<{
        id: string;
        name: string;
        country: string | null;
        region: string | null;
        logo: string | null;
        heroImage: string | null;
        bio: string | null;
        verified: boolean;
        isPremium: boolean;
        websiteUrl: string | null;
        followersCount: number;
        spiritsCount: number;
        poursCount: number;
        isFollowing: boolean;
        hasOwner: boolean;
        isClaimed: boolean;
    }>;
    getPours(distilleryId: string, userId: string): Promise<{
        id: any;
        whyItHit: any;
        isShared: any;
        isDistilleryPost: any;
        image: any;
        imageFileId: any;
        imageIsPublic: any;
        createdAt: any;
        user: any;
        spirit: any;
        flavorTags: any;
        cheersCount: any;
        hasCheered: boolean;
        distilleryVerified: boolean;
    }[]>;
    getSpirits(distilleryId: string, userId: string): Promise<{
        id: string;
        name: string;
        category: string | null;
        style: string | null;
        abv: number | null;
        region: string | null;
        bottleImage: string | null;
        officialTastingNotes: string | null;
        distillery: {
            name: string;
            id: string;
            verified: boolean;
            ispremium: boolean;
        } | null;
        flavorTags: {
            name: string;
            id: string;
        }[];
        isOnRadar: boolean;
        hasInsights: boolean;
        insights: {
            howWeCreated: string | null;
            whatMakesItSpecial: string | null;
            tastingNotes: string | null;
        } | null;
    }[]>;
    toggleFollow(distilleryId: string, userId: string): Promise<{
        isFollowing: boolean;
        message: string;
    }>;
    updateInsights(distilleryId: string, spiritId: string, userId: string, data: {
        howWeCreated?: string;
        whatMakesItSpecial?: string;
        tastingNotes?: string;
    }): Promise<{
        message: string;
        insights: {
            howWeCreated: string | null;
            whatMakesItSpecial: string | null;
            tastingNotes: string | null;
        };
    }>;
    getAnalytics(distilleryId: string, userId: string): Promise<{
        overview: {
            totalSpirits: number;
            totalFollowers: number;
            totalRadarAdds: number;
            totalPours: number;
        };
        topSpiritsOnRadar: {
            id: string;
            name: string;
            bottleImage: string | null;
            radarAdds: number;
        }[];
        topFlavorTags: {
            name: string;
            count: number;
        }[];
        monthlyGraph: {
            month: string;
            count: number;
        }[];
    }>;
    checkOwnership(distilleryId: string, userId: string): Promise<void>;
    addSpiritToShelf(distilleryId: string, userId: string, dto: {
        name: string;
        category?: string;
        style?: string;
        abv?: number;
        region?: string;
        bottleImage: string;
        officialTastingNotes?: string;
        flavorTagIds?: string[];
    }): Promise<{
        id: string;
        name: string;
        category: string | null;
        style: string | null;
        abv: number | null;
        region: string | null;
        bottleImage: string | null;
        officialTastingNotes: string | null;
        distillery: {
            name: string;
            id: string;
            verified: boolean;
        } | null;
        flavorTags: {
            id: string;
            name: string;
        }[];
        createdAt: Date;
    }>;
    updateSpiritOnShelf(distilleryId: string, spiritId: string, userId: string, dto: {
        name?: string;
        category?: string;
        style?: string;
        abv?: number;
        region?: string;
        bottleImage?: string;
        officialTastingNotes?: string;
        flavorTagIds?: string[];
    }): Promise<{
        id: string;
        name: string;
        category: string | null;
        style: string | null;
        abv: number | null;
        region: string | null;
        bottleImage: string | null;
        officialTastingNotes: string | null;
        distillery: {
            name: string;
            id: string;
            verified: boolean;
        } | null;
        flavorTags: {
            id: string;
            name: string;
        }[];
        createdAt: Date;
    }>;
    deleteSpiritFromShelf(distilleryId: string, spiritId: string, userId: string): Promise<{
        message: string;
    }>;
    updateProfile(distilleryId: string, userId: string, dto: {
        name?: string;
        bio?: string;
        logo?: string;
        heroImage?: string;
        region?: string;
        country?: string;
        spiritTypes?: string;
    }): Promise<{
        id: string;
        name: string;
        bio: string | null;
        logo: string | null;
        heroImage: string | null;
        region: string | null;
        country: string | null;
        spiritTypes: string | null;
        verified: boolean;
    }>;
}
