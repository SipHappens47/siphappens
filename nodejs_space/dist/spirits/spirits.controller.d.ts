import { SpiritsService } from './spirits.service';
import { RecognizeBottleDto } from './dto/recognize-bottle.dto';
import { CreateSpiritDto } from './dto/create-spirit.dto';
import { UpdateSpiritDto } from './dto/update-spirit.dto';
export declare class SpiritsController {
    private spiritsService;
    constructor(spiritsService: SpiritsService);
    recognizeBottle(dto: RecognizeBottleDto): Promise<any>;
    searchBottleImages(query: string): Promise<{
        images: never[];
    }>;
    searchSpirits(query: string): Promise<{
        id: any;
        name: any;
        category: any;
        style: any;
        abv: number | null;
        region: any;
        bottleImage: any;
        createdAt: any;
        distillery: {
            id: any;
            name: any;
            country: any;
            region: any;
        };
        flavorTags: any;
    }[]>;
    createSpirit(dto: CreateSpiritDto): Promise<{
        id: any;
        name: any;
        category: any;
        style: any;
        abv: number | null;
        region: any;
        bottleImage: any;
        createdAt: any;
        distillery: {
            id: any;
            name: any;
            country: any;
            region: any;
        };
        flavorTags: any;
    }>;
    getSpirit(id: string): Promise<{
        id: any;
        name: any;
        category: any;
        style: any;
        abv: number | null;
        region: any;
        bottleImage: any;
        createdAt: any;
        distillery: {
            id: any;
            name: any;
            country: any;
            region: any;
        };
        flavorTags: any;
    }>;
    updateSpirit(id: string, dto: UpdateSpiritDto): Promise<{
        id: any;
        name: any;
        category: any;
        style: any;
        abv: number | null;
        region: any;
        bottleImage: any;
        createdAt: any;
        distillery: {
            id: any;
            name: any;
            country: any;
            region: any;
        };
        flavorTags: any;
    }>;
}
