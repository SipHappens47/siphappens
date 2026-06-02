import { ConnectionsService } from './connections.service';
import { SendConnectionRequestDto } from './dto/send-connection-request.dto';
export declare class ConnectionsController {
    private connectionsService;
    constructor(connectionsService: ConnectionsService);
    searchUsers(req: any, query: string): Promise<{
        id: string;
        name: string;
        profilePhoto: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        isConnected: boolean;
        hasPendingRequest: boolean;
    }[]>;
    sendRequest(req: any, dto: SendConnectionRequestDto): Promise<{
        id: any;
        status: any;
        createdAt: any;
        acceptedAt: any;
        initiator: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
        receiver: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
    }>;
    sendRequestById(req: any, userId: string): Promise<{
        id: any;
        status: any;
        createdAt: any;
        acceptedAt: any;
        initiator: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
        receiver: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
    }>;
    acceptRequest(req: any, connectionId: string): Promise<{
        id: any;
        status: any;
        createdAt: any;
        acceptedAt: any;
        initiator: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
        receiver: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
    }>;
    removeConnection(req: any, connectionId: string): Promise<{
        message: string;
    }>;
    getPendingRequests(req: any): Promise<{
        id: any;
        status: any;
        createdAt: any;
        acceptedAt: any;
        initiator: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
        receiver: {
            id: any;
            name: any;
            profilePhoto: any;
            experienceLevel: any;
        };
    }[]>;
    getConnections(req: any): Promise<{
        connectionId: string;
        user: {
            id: string;
            name: string;
            profilePhoto: string | null;
            bio: string | null;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            isOfficial: boolean;
        };
        isMuted: boolean;
        connectedAt: Date | null;
    }[]>;
    muteConnection(req: any, userId: string): Promise<{
        message: string;
        isMuted: boolean;
    }>;
    unmuteConnection(req: any, userId: string): Promise<{
        message: string;
        isMuted: boolean;
    }>;
    getMuteStatus(req: any, userId: string): Promise<{
        isMuted: boolean;
    }>;
}
