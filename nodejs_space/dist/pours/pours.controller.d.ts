import { PoursService } from './pours.service';
import { CreatePourDto } from './dto/create-pour.dto';
import { UpdatePourDto } from './dto/update-pour.dto';
export declare class PoursController {
    private poursService;
    constructor(poursService: PoursService);
    createPour(req: any, dto: CreatePourDto): Promise<{
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
    getPours(req: any, category?: string, flavorTags?: string, startDate?: string, endDate?: string, search?: string): Promise<{
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
    getPour(req: any, id: string): Promise<{
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
    updatePour(req: any, id: string, dto: UpdatePourDto): Promise<{
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
    deletePour(req: any, id: string): Promise<{
        message: string;
    }>;
}
