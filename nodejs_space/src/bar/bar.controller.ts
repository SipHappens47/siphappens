import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BarService } from './bar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('The Bar (Social Feed)')
@Controller('api/bar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BarController {
  constructor(private barService: BarService) {}

  @Get()
  @ApiOperation({ summary: 'Get The Bar feed (Fellow Sippers shared pours only)' })
  @ApiResponse({ status: 200, description: 'List of shared pours from connections' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by spirit category' })
  @ApiQuery({ name: 'flavorTags', required: false, description: 'Filter by flavor tags (comma-separated)' })
  async getBarFeed(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('flavorTags') flavorTags?: string,
  ) {
    return this.barService.getBarFeed(req.user.userId, {
      category,
      flavorTags,
    });
  }
}
