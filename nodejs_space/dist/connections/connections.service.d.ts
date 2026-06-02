import { PrismaService } from '../prisma/prisma.service';
export declare class ConnectionsService {
    private prisma;
    constructor(prisma: PrismaService);
    searchUsers(currentUserId: string, query: string): Promise<{
        id: string;
        name: string;
        profilePhoto: string | null;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        isConnected: boolean;
        hasPendingRequest: boolean;
    }[]>;
    sendConnectionRequestById(initiatorId: string, receiverId: string): Promise<{
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
    sendConnectionRequest(initiatorId: string, receiverIdentifier: string): Promise<{
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
    acceptConnectionRequest(userId: string, connectionId: string): Promise<{
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
    rejectConnectionRequest(userId: string, connectionId: string): Promise<{
        message: string;
    }>;
    getPendingRequests(userId: string): Promise<{
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
    getConnections(userId: string): Promise<{
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
    areConnected(userId1: string, userId2: string): Promise<boolean>;
    muteConnection(userId: string, targetUserId: string): Promise<{
        message: string;
        isMuted: boolean;
    }>;
    unmuteConnection(userId: string, targetUserId: string): Promise<{
        message: string;
        isMuted: boolean;
    }>;
    getMuteStatus(userId: string, targetUserId: string): Promise<boolean>;
    private formatConnectionResponse;
}
