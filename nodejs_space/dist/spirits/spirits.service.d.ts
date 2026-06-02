import { PrismaService } from '../prisma/prisma.service';
import { RecognizeBottleDto } from './dto/recognize-bottle.dto';
import { CreateSpiritDto } from './dto/create-spirit.dto';
import { UpdateSpiritDto } from './dto/update-spirit.dto';
import { CreateDistilleryDto } from './dto/create-distillery.dto';
export declare class SpiritsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private normalizeRegion;
    recognizeBottle(dto: RecognizeBottleDto): Promise<any>;
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
    createDistillery(dto: CreateDistilleryDto): Promise<{
        region: string | null;
        country: string | null;
        bio: string | null;
        logo: string | null;
        name: string;
        id: string;
        createdat: Date;
        heroimage: string | null;
        verified: boolean;
        ispremium: boolean;
        websiteurl: string | null;
        latitude: number | null;
        longitude: number | null;
        followerscount: number;
        owneruserid: string | null;
        spirittypes: string | null;
        isclaimed: boolean;
    }>;
    searchDistilleries(query: string): Promise<{
        region: string | null;
        country: string | null;
        bio: string | null;
        logo: string | null;
        name: string;
        id: string;
        createdat: Date;
        heroimage: string | null;
        verified: boolean;
        ispremium: boolean;
        websiteurl: string | null;
        latitude: number | null;
        longitude: number | null;
        followerscount: number;
        owneruserid: string | null;
        spirittypes: string | null;
        isclaimed: boolean;
    }[]>;
    searchBottleImages(query: string): Promise<{
        images: never[];
    }>;
    private formatSpiritResponse;
}
