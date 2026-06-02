import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';
export declare class CheersService {
    private prisma;
    private connectionsService;
    constructor(prisma: PrismaService, connectionsService: ConnectionsService);
    addCheer(userId: string, pourId: string): Promise<{
        id: string;
        createdAt: Date;
    }>;
    removeCheer(userId: string, pourId: string): Promise<{
        message: string;
    }>;
    getCheersCount(pourId: string): Promise<number>;
    hasUserCheered(userId: string, pourId: string): Promise<boolean>;
}
