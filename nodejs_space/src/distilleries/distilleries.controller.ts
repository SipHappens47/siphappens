import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DistilleriesService } from './distilleries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateInsightsDto } from './dto/update-insights.dto';
import { AddSpiritDto } from './dto/add-spirit.dto';
import { UpdateSpiritDto } from './dto/update-spirit.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api/distilleries')
@UseGuards(JwtAuthGuard)
export class DistilleriesController {
  constructor(private readonly distilleriesService: DistilleriesService) {}

  @Get('search')
  async search(@Query('q') q: string, @Request() req: any) {
    const searchTerm = q?.trim() ?? '';
    return this.distilleriesService.search(searchTerm, req.user.userId);
  }

  @Get('discover')
  async discover(@Request() req: any) {
    return this.distilleriesService.discover(req.user.userId);
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string, @Request() req: any) {
    return this.distilleriesService.getProfile(id, req.user.userId);
  }

  @Get(':id/pours')
  async getPours(@Param('id') id: string, @Request() req: any) {
    return this.distilleriesService.getPours(id, req.user.userId);
  }

  @Get(':id/spirits')
  async getSpirits(@Param('id') id: string, @Request() req: any) {
    return this.distilleriesService.getSpirits(id, req.user.userId);
  }

  @Post(':id/follow')
  async toggleFollow(@Param('id') id: string, @Request() req: any) {
    return this.distilleriesService.toggleFollow(id, req.user.userId);
  }

  @Post(':id/insights/:spiritId')
  async updateInsights(
    @Param('id') id: string,
    @Param('spiritId') spiritId: string,
    @Body() dto: UpdateInsightsDto,
    @Request() req: any,
  ) {
    return this.distilleriesService.updateInsights(
      id,
      spiritId,
      req.user.userId,
      dto,
    );
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string, @Request() req: any) {
    return this.distilleriesService.getAnalytics(id, req.user.userId);
  }

  // Distillery owner endpoints - manage shelf
  @Post(':id/shelf/spirits')
  async addSpiritToShelf(
    @Param('id') id: string,
    @Body() dto: AddSpiritDto,
    @Request() req: any,
  ) {
    return this.distilleriesService.addSpiritToShelf(id, req.user.userId, dto);
  }

  @Put(':id/shelf/spirits/:spiritId')
  async updateSpiritOnShelf(
    @Param('id') id: string,
    @Param('spiritId') spiritId: string,
    @Body() dto: UpdateSpiritDto,
    @Request() req: any,
  ) {
    return this.distilleriesService.updateSpiritOnShelf(id, spiritId, req.user.userId, dto);
  }

  @Delete(':id/shelf/spirits/:spiritId')
  async deleteSpiritFromShelf(
    @Param('id') id: string,
    @Param('spiritId') spiritId: string,
    @Request() req: any,
  ) {
    return this.distilleriesService.deleteSpiritFromShelf(id, spiritId, req.user.userId);
  }

  // Distillery owner endpoint - update profile
  @Put(':id/profile')
  async updateDistilleryProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @Request() req: any,
  ) {
    return this.distilleriesService.updateProfile(id, req.user.userId, dto);
  }
}
