import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendConnectionRequestDto } from './dto/send-connection-request.dto';

@ApiTags('Connections')
@Controller('api/connections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private connectionsService: ConnectionsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiResponse({ status: 200, description: 'List of users matching search query' })
  async searchUsers(@Request() req: any, @Query('query') query: string) {
    return this.connectionsService.searchUsers(req.user.userId, query);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a connection request to another user by name or email' })
  @ApiResponse({ status: 201, description: 'Connection request sent' })
  async sendRequest(@Request() req: any, @Body() dto: SendConnectionRequestDto) {
    return this.connectionsService.sendConnectionRequest(req.user.userId, dto.receiverEmail);
  }

  @Post('send/:userId')
  @ApiOperation({ summary: 'Send a connection request to another user by ID' })
  @ApiResponse({ status: 201, description: 'Connection request sent' })
  async sendRequestById(@Request() req: any, @Param('userId') userId: string) {
    return this.connectionsService.sendConnectionRequestById(req.user.userId, userId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a connection request' })
  @ApiResponse({ status: 200, description: 'Connection accepted' })
  async acceptRequest(@Request() req: any, @Param('id') connectionId: string) {
    return this.connectionsService.acceptConnectionRequest(req.user.userId, connectionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reject or remove a connection' })
  @ApiResponse({ status: 200, description: 'Connection removed' })
  async removeConnection(@Request() req: any, @Param('id') connectionId: string) {
    return this.connectionsService.rejectConnectionRequest(req.user.userId, connectionId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending connection requests (received)' })
  @ApiResponse({ status: 200, description: 'List of pending requests' })
  async getPendingRequests(@Request() req: any) {
    return this.connectionsService.getPendingRequests(req.user.userId);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get pending connection requests this user has sent' })
  @ApiResponse({ status: 200, description: 'List of sent pending requests' })
  async getSentRequests(@Request() req: any) {
    return this.connectionsService.getSentRequests(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accepted connections (Fellow Sippers)' })
  @ApiResponse({ status: 200, description: 'List of connections' })
  async getConnections(@Request() req: any) {
    return this.connectionsService.getConnections(req.user.userId);
  }

  @Post('mute/:userId')
  @ApiOperation({ summary: 'Mute a connection (hide their posts from your feed)' })
  @ApiResponse({ status: 200, description: 'Connection muted' })
  async muteConnection(@Request() req: any, @Param('userId') userId: string) {
    return this.connectionsService.muteConnection(req.user.userId, userId);
  }

  @Post('unmute/:userId')
  @ApiOperation({ summary: 'Unmute a connection (show their posts in your feed again)' })
  @ApiResponse({ status: 200, description: 'Connection unmuted' })
  async unmuteConnection(@Request() req: any, @Param('userId') userId: string) {
    return this.connectionsService.unmuteConnection(req.user.userId, userId);
  }

  @Get('mute-status/:userId')
  @ApiOperation({ summary: 'Get mute status for a specific user' })
  @ApiResponse({ status: 200, description: 'Mute status retrieved' })
  async getMuteStatus(@Request() req: any, @Param('userId') userId: string) {
    const isMuted = await this.connectionsService.getMuteStatus(req.user.userId, userId);
    return { isMuted };
  }
}
