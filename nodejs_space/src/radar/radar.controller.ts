import { Controller, Post, Delete, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RadarService } from './radar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('On My Radar (Wishlist)')
@Controller('api/radar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RadarController {
  constructor(private radarService: RadarService) {}

  @Post(':spiritId')
  @ApiOperation({ summary: 'Add a spirit to your radar (wishlist)' })
  @ApiResponse({ status: 201, description: 'Spirit added to radar' })
  async addToRadar(@Request() req: any, @Param('spiritId') spiritId: string) {
    return this.radarService.addToRadar(req.user.userId, spiritId);
  }

  @Delete(':spiritId')
  @ApiOperation({ summary: 'Remove a spirit from your radar' })
  @ApiResponse({ status: 200, description: 'Spirit removed from radar' })
  async removeFromRadar(@Request() req: any, @Param('spiritId') spiritId: string) {
    return this.radarService.removeFromRadar(req.user.userId, spiritId);
  }

  @Get()
  @ApiOperation({ summary: 'Get your radar (wishlist)' })
  @ApiResponse({ status: 200, description: 'List of spirits on your radar' })
  async getRadar(@Request() req: any) {
    return this.radarService.getRadar(req.user.userId);
  }
}
