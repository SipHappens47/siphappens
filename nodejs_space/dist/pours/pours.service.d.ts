import { PrismaService } from '../prisma/prisma.service';
import { CreatePourDto } from './dto/create-pour.dto';
import { UpdatePourDto } from './dto/update-pour.dto';
import { BadgesService } from '../badges/badges.service';
export declare class PoursService {
    private prisma;
    private badgesService;
    constructor(prisma: PrismaService, badgesService: BadgesService);
    createPour(userId: string, dto: CreatePourDto): Promise<{
        id: any;
        whyItHit: any;
        isShared: any;
        image: any;
        createdAt: any;
        updatedAt: any;
        spirit: {
            id: any;
            name: any;
            distilleryId: any;
            distilleryName: any;
            category: any;
            style: any;
            abv: number | null;
            region: any;
            bottleImage: any;
            distillery: {
                id: any;
                name: any;
                country: any;
                region: any;
            };
            flavorTags: any;
        };
        flavorTags: any;
    }>;
    getPours(userId: string, filters: {
        category?: string;
        flavorTags?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }): Promise<{
        id: any;
        whyItHit: any;
        isShared: any;
        image: any;
        createdAt: any;
        updatedAt: any;
        spirit: {
            id: any;
            name: any;
            distilleryId: any;
            distilleryName: any;
            category: any;
            style: any;
            abv: number | null;
            region: any;
            bottleImage: any;
            distillery: {
                id: any;
                name: any;
                country: any;
                region: any;
            };
            flavorTags: any;
        };
        flavorTags: any;
    }[]>;
    getPour(userId: string, id: string): Promise<{
        id: any;
        whyItHit: any;
        isShared: any;
        image: any;
        createdAt: any;
        updatedAt: any;
        spirit: {
            id: any;
            name: any;
            distilleryId: any;
            distilleryName: any;
            category: any;
            style: any;
            abv: number | null;
            region: any;
            bottleImage: any;
            distillery: {
                id: any;
                name: any;
                country: any;
                region: any;
            };
            flavorTags: any;
        };
        flavorTags: any;
    }>;
    updatePour(userId: string, id: string, dto: UpdatePourDto): Promise<{
        id: any;
        whyItHit: any;
        isShared: any;
        image: any;
        createdAt: any;
        updatedAt: any;
        spirit: {
            id: any;
            name: any;
            distilleryId: any;
            distilleryName: any;
            category: any;
            style: any;
            abv: number | null;
            region: any;
            bottleImage: any;
            distillery: {
                id: any;
                name: any;
                country: any;
                region: any;
            };
            flavorTags: any;
        };
        flavorTags: any;
    }>;
    deletePour(userId: string, id: string): Promise<{
        message: string;
    }>;
    getUserPublicPours(userId: string): Promise<{
        id: any;
        whyItHit: any;
        isShared: any;
        image: any;
        createdAt: any;
        updatedAt: any;
        spirit: {
            id: any;
            name: any;
            distilleryId: any;
            distilleryName: any;
            category: any;
            style: any;
            abv: number | null;
            region: any;
            bottleImage: any;
            distillery: {
                id: any;
                name: any;
                country: any;
                region: any;
            };
            flavorTags: any;
        };
        flavorTags: any;
    }[]>;
    private formatPourResponse;
}
