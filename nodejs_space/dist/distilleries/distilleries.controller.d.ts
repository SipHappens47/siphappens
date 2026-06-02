import { DistilleriesService } from './distilleries.service';
import { UpdateInsightsDto } from './dto/update-insights.dto';
import { AddSpiritDto } from './dto/add-spirit.dto';
import { UpdateSpiritDto } from './dto/update-spirit.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class DistilleriesController {
    private readonly distilleriesService;
    constructor(distilleriesService: DistilleriesService);
    search(q: string, req: any): Promise<{
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
    discover(req: any): Promise<{
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
    getProfile(id: string, req: any): Promise<{
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
    getPours(id: string, req: any): Promise<{
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
    getSpirits(id: string, req: any): Promise<{
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
    toggleFollow(id: string, req: any): Promise<{
        isFollowing: boolean;
        message: string;
    }>;
    updateInsights(id: string, spiritId: string, dto: UpdateInsightsDto, req: any): Promise<{
        message: string;
        insights: {
            howWeCreated: string | null;
            whatMakesItSpecial: string | null;
            tastingNotes: string | null;
        };
    }>;
    getAnalytics(id: string, req: any): Promise<{
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
    addSpiritToShelf(id: string, dto: AddSpiritDto, req: any): Promise<{
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
    updateSpiritOnShelf(id: string, spiritId: string, dto: UpdateSpiritDto, req: any): Promise<{
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
    deleteSpiritFromShelf(id: string, spiritId: string, req: any): Promise<{
        message: string;
    }>;
    updateDistilleryProfile(id: string, dto: UpdateProfileDto, req: any): Promise<{
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
