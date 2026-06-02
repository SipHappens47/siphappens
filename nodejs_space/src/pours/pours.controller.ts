import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PoursService } from './pours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePourDto } from './dto/create-pour.dto';
import { UpdatePourDto } from './dto/update-pour.dto';

@ApiTags('Pours')
@Controller('api/pours')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PoursController {
  constructor(private poursService: PoursService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pour entry' })
  @ApiResponse({ status: 201, description: 'Pour created successfully' })
  async createPour(@Request() req: any, @Body() dto: CreatePourDto) {
    return this.poursService.createPour(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user pours with optional filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'flavorTags', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Pours retrieved successfully' })
  async getPours(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('flavorTags') flavorTags?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.poursService.getPours(req.user.userId, {
      category,
      flavorTags,
      startDate,
      endDate,
      search,
    });
  }

  @Get('user/:userId/public')
  @ApiOperation({ summary: 'Get public pours for a specific user (shared to The Bar)' })
  @ApiResponse({ status: 200, description: 'Public pours retrieved successfully' })
  async getUserPublicPours(@Param('userId') userId: string) {
    return this.poursService.getUserPublicPours(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pour details by ID' })
  @ApiResponse({ status: 200, description: 'Pour details retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Pour not found' })
  async getPour(@Request() req: any, @Param('id') id: string) {
    return this.poursService.getPour(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update pour details' })
  @ApiResponse({ status: 200, description: 'Pour updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Pour not found' })
  async updatePour(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePourDto,
  ) {
    return this.poursService.updatePour(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pour' })
  @ApiResponse({ status: 200, description: 'Pour deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Pour not found' })
  async deletePour(@Request() req: any, @Param('id') id: string) {
    return this.poursService.deletePour(req.user.userId, id);
  }
}