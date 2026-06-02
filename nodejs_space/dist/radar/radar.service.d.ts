import { PrismaService } from '../prisma/prisma.service';
export declare class RadarService {
    private prisma;
    constructor(prisma: PrismaService);
    addToRadar(userId: string, spiritId: string): Promise<{
        id: string;
        createdAt: Date;
    }>;
    removeFromRadar(userId: string, spiritId: string): Promise<{
        message: string;
    }>;
    getRadar(userId: string): Promise<{
        id: string;
        addedAt: Date;
        spirit: {
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
            } | undefined;
            flavorTags: {
                id: any;
                name: any;
            }[];
        };
    }[]>;
    isOnRadar(userId: string, spiritId: string): Promise<boolean>;
}
