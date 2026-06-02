import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('badges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user badges with progress',
    description:
      'Returns all badges with unlock status and progress toward each tier',
  })
  async getMyBadges(@Request() req: any) {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.badgesService.getUserBadgesWithProgress(userId);
  }

  @Get('taste-summary')
  @ApiOperation({
    summary: 'Get taste summary statistics',
    description:
      'Returns flavor count, region count, distillery count, and distributions',
  })
  async getTasteSummary(@Request() req: any) {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.badgesService.getTasteSummary(userId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get public user badges with progress',
    description:
      'Returns all badges with unlock status and progress for a specific user',
  })
  async getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadgesWithProgress(userId);
  }

  @Get('user/:userId/taste-summary')
  @ApiOperation({
    summary: 'Get public user taste summary',
    description:
      'Returns flavor count, region count, distillery count, and distributions for a specific user',
  })
  async getUserTasteSummary(@Param('userId') userId: string) {
    return this.badgesService.getTasteSummary(userId);
  }
}
