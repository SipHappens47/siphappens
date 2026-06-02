import { SearchService } from './search.service';
export declare class SearchController {
    private searchService;
    constructor(searchService: SearchService);
    universalSearch(query: string, req: any): Promise<{
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
}
