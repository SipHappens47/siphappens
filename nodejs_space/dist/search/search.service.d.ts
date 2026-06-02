import { PrismaService } from '../prisma/prisma.service';
export declare class SearchService {
    private prisma;
    constructor(prisma: PrismaService);
    universalSearch(query: string, currentUserId: string): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
            profilePhoto: string | null;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            isOfficial: boolean;
            type: "user";
        }[];
        spirits: {
            id: string;
            name: string;
            category: string | null;
            style: string | null;
            abv: number | null;
            region: string | null;
            bottleImage: string | null;
            distillery: {
                id: string;
                name: string;
                country: string | null;
                region: string | null;
            } | null;
            type: "spirit";
        }[];
        distilleries: {
            id: string;
            name: string;
            country: string | null;
            region: string | null;
            spiritsCount: number;
            type: "distillery";
        }[];
        flavorTags: {
            id: string;
            name: string;
            spiritsCount: number;
            poursCount: number;
            type: "flavorTag";
        }[];
        categories: {
            name: string;
            spiritsCount: number;
            type: "category";
        }[];
        locations: {
            name: string;
            type: "location";
        }[];
        reviews: {
            id: string;
            whyItHit: string;
            preview: string;
            spirit: {
                id: string;
                name: string;
                bottleImage: string | null;
            };
            user: {
                id: string;
                name: string;
                profilePhoto: string | null;
            };
            createdAt: Date;
            type: "review";
        }[];
    }>;
    private searchUsers;
    private searchSpirits;
    private searchDistilleries;
    private searchFlavorTags;
    private searchCategories;
    private searchLocations;
    private searchReviews;
    private createReviewPreview;
}
