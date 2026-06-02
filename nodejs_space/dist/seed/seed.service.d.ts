import { PrismaService } from '../prisma/prisma.service';
export declare class SeedService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    autoImportFromPublicDatasets(): Promise<{
        connecticut: number;
        iowa: number;
        totalImported: number;
        totalDuplicates: number;
    }>;
    importFromUploadedCsv(buffer: Buffer): Promise<{
        totalImported: number;
        imported: number;
        duplicates: number;
    }>;
    private fetchConnecticutData;
    private fetchIowaData;
    private mapConnecticutData;
    private mapIowaData;
    private mapGenericCsvToSpirits;
    private importSpirits;
    private extractCategory;
    private parseABV;
    private cleanString;
    getDatabaseStats(): Promise<{
        totalSpirits: number;
        totalDistilleries: number;
        spiritsWithImages: number;
        spiritsWithoutImages: number;
    }>;
    seedTestDistilleries(): Promise<{
        count: number;
    }>;
}
