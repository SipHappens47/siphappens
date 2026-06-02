import { PrismaService } from '../prisma/prisma.service';
export declare class FlavorTagsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllFlavorTags(): Promise<{
        name: string;
        id: string;
    }[]>;
}
