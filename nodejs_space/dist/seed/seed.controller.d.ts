import { SeedService } from './seed.service';
export declare class SeedController {
    private readonly seedService;
    private readonly logger;
    constructor(seedService: SeedService);
    autoImport(): Promise<{
        success: boolean;
        message: string;
        details: {
            connecticut: number;
            iowa: number;
            totalImported: number;
            totalDuplicates: number;
        };
    }>;
    uploadCsv(file: any): Promise<{
        success: boolean;
        message: string;
        details: {
            totalImported: number;
            imported: number;
            duplicates: number;
        };
    }>;
    getStats(): Promise<{
        totalSpirits: number;
        totalDistilleries: number;
        spiritsWithImages: number;
        spiritsWithoutImages: number;
    }>;
    seedTestDistilleries(): Promise<{
        success: boolean;
        message: string;
        count: number;
    }>;
}
