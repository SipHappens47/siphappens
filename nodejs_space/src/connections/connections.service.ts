import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  // Search users by name or email
  async searchUsers(currentUserId: string, query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } }, // Exclude current user
          { isofficial: false }, // Exclude official account from connection search
          { owneddistillery: { none: { verified: true } } }, // Verified distillery owners appear as their distillery, not as sippers
          {
            OR: [
              {
                name: {
                  contains: query.trim(),
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        profilephoto: true,
        experiencelevel: true,
      },
      take: 20,
    });

    // Check connection status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const connection = await this.prisma.connection.findFirst({
          where: {
            OR: [
              { initiatorid: currentUserId, receiverid: user.id },
              { initiatorid: user.id, receiverid: currentUserId },
            ],
          },
        });

        return {
          id: user.id,
          name: user.name,
          profilePhoto: user.profilephoto,
          experienceLevel: user.experiencelevel,
          isConnected: connection?.status === 'Accepted',
          hasPendingRequest: connection?.status === 'Pending',
        };
      })
    );

    return usersWithStatus;
  }

  // Send a connection request by user ID
  async sendConnectionRequestById(initiatorId: string, receiverId: string) {
    if (!receiverId) {
      throw new BadRequestException('Receiver ID is required');
    }

    // Find receiver
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    if (receiver.id === initiatorId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    // Check if connection already exists (in either direction)
    const existingConnection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorid: initiatorId, receiverid: receiver.id },
          { initiatorid: receiver.id, receiverid: initiatorId },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === 'Accepted') {
        throw new BadRequestException('Already connected');
      }
      if (existingConnection.status === 'Pending') {
        throw new BadRequestException('Connection request already sent');
      }
    }

    // Create connection request
    const connection = await this.prisma.connection.create({
      data: {
        initiatorid: initiatorId,
        receiverid: receiver.id,
        status: 'Pending',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
      },
    });

    return this.formatConnectionResponse(connection);
  }

  // Send a connection request by email or name
  async sendConnectionRequest(initiatorId: string, receiverIdentifier: string) {
    if (!receiverIdentifier) {
      throw new BadRequestException('Name or email is required');
    }

    const identifier = receiverIdentifier.trim();

    // Try to find receiver by email first
    let receiver = await this.prisma.user.findUnique({
      where: { email: identifier },
    });

    // If not found by email, try searching by name
    if (!receiver) {
      const usersByName = await this.prisma.user.findMany({
        where: {
          name: {
            equals: identifier,
            mode: 'insensitive',
          },
        },
        take: 2, // Take 2 to check if there are multiple matches
      });

      if (usersByName.length === 0) {
        throw new NotFoundException('User not found with that name or email');
      }

      if (usersByName.length > 1) {
        throw new BadRequestException('Multiple users found with that name. Please use their email address instead.');
      }

      receiver = usersByName[0];
    }

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    if (receiver.id === initiatorId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    // Check if connection already exists (in either direction)
    const existingConnection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorid: initiatorId, receiverid: receiver.id },
          { initiatorid: receiver.id, receiverid: initiatorId },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === 'Accepted') {
        throw new BadRequestException('Already connected');
      }
      if (existingConnection.status === 'Pending') {
        throw new BadRequestException('Connection request already sent');
      }
    }

    // Create connection request
    const connection = await this.prisma.connection.create({
      data: {
        initiatorid: initiatorId,
        receiverid: receiver.id,
        status: 'Pending',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
      },
    });

    return this.formatConnectionResponse(connection);
  }

  // Accept connection request
  async acceptConnectionRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.receiverid !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    if (connection.status === 'Accepted') {
      throw new BadRequestException('Connection already accepted');
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: 'Accepted',
        acceptedat: new Date(),
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
      },
    });

    return this.formatConnectionResponse(updated);
  }

  // Reject/remove connection
  async rejectConnectionRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // User must be either initiator or receiver
    if (connection.initiatorid !== userId && connection.receiverid !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    return { message: 'Connection removed successfully' };
  }

  // Get pending connection requests (received by user)
  async getPendingRequests(userId: string) {
    const requests = await this.prisma.connection.findMany({
      where: {
        receiverid: userId,
        status: 'Pending',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            experiencelevel: true,
          },
        },
      },
      orderBy: {
        createdat: 'desc',
      },
    });

    return requests.map((req) => this.formatConnectionResponse(req));
  }

  // Get all connections (mutual connections)
  async getConnections(userId: string) {
    const connections = await this.prisma.connection.findMany({
      where: {
        OR: [
          { initiatorid: userId },
          { receiverid: userId },
        ],
        status: 'Accepted',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            bio: true,
            experiencelevel: true,
            isofficial: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilephoto: true,
            bio: true,
            experiencelevel: true,
            isofficial: true,
          },
        },
      },
      orderBy: {
        acceptedat: 'desc',
      },
    });

    // Return the other user in each connection
    return connections.map((conn) => {
      const otherUser = conn.initiatorid === userId ? conn.receiver : conn.initiator;
      return {
        connectionId: conn.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          profilePhoto: otherUser.profilephoto,
          bio: otherUser.bio,
          experienceLevel: otherUser.experiencelevel,
          isOfficial: otherUser.isofficial ?? false,
        },
        isMuted: conn.ismuted ?? false,
        connectedAt: conn.acceptedat,
      };
    });
  }

  // Check if two users are connected
  async areConnected(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorid: userId1, receiverid: userId2, status: 'Accepted' },
          { initiatorid: userId2, receiverid: userId1, status: 'Accepted' },
        ],
      },
    });

    return !!connection;
  }

  // Mute a connection (hide their posts from your feed)
  async muteConnection(userId: string, targetUserId: string) {
    // Find the connection between these two users
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorid: userId, receiverid: targetUserId, status: 'Accepted' },
          { initiatorid: targetUserId, receiverid: userId, status: 'Accepted' },
        ],
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    await this.prisma.connection.update({
      where: { id: connection.id },
      data: { ismuted: true },
    });

    return { message: 'Connection muted successfully', isMuted: true };
  }

  // Unmute a connection
  async unmuteConnection(userId: string, targetUserId: string) {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorid: userId, receiverid: targetUserId, status: 'Accepted' },
          { initiatorid: targetUserId, receiverid: userId, status: 'Accepted' },
        ],
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    await this.prisma.connection.update({
      where: { id: connection.id },
      data: { ismuted: false },
    });

    return { message: 'Connection unmuted successfully', isMuted: false };
  }

  // Get mute status for a specific user
  async getMuteStatus(userId: string, targetUserId: string): Promise<boolean> {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorid: userId, receiverid: targetUserId, status: 'Accepted' },
          { initiatorid: targetUserId, receiverid: userId, status: 'Accepted' },
        ],
      },
    });

    return connection?.ismuted ?? false;
  }

  private formatConnectionResponse(connection: any) {
    return {
      id: connection.id,
      status: connection.status,
      createdAt: connection.createdat,
      acceptedAt: connection.acceptedat,
      initiator: {
        id: connection.initiator.id,
        name: connection.initiator.name,
        profilePhoto: connection.initiator.profilephoto,
        experienceLevel: connection.initiator.experiencelevel,
      },
      receiver: {
        id: connection.receiver.id,
        name: connection.receiver.name,
        profilePhoto: connection.receiver.profilephoto,
        experienceLevel: connection.receiver.experiencelevel,
      },
    };
  }
}
