import { RadarService } from './radar.service';
export declare class RadarController {
    private radarService;
    constructor(radarService: RadarService);
    addToRadar(req: any, spiritId: string): Promise<{
        id: string;
        createdAt: Date;
    }>;
    removeFromRadar(req: any, spiritId: string): Promise<{
        message: string;
    }>;
    getRadar(req: any): Promise<{
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
}
