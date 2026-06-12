import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SpiritsService } from './spirits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecognizeBottleDto } from './dto/recognize-bottle.dto';
import { CreateSpiritDto } from './dto/create-spirit.dto';
import { UpdateSpiritDto } from './dto/update-spirit.dto';
import { CreateDistilleryDto } from './dto/create-distillery.dto';

@ApiTags('Spirits')
@Controller('api/spirits')
export class SpiritsController {
  constructor(private spiritsService: SpiritsService) {}

  @Post('recognize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recognize spirit from bottle image using AI' })
  @ApiResponse({ status: 200, description: 'Bottle analyzed successfully' })
  async recognizeBottle(@Body() dto: RecognizeBottleDto) {
    return this.spiritsService.recognizeBottle(dto);
  }

  @Get('search-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for bottle images' })
  @ApiResponse({ status: 200, description: 'Image URLs returned' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query for bottle images' })
  async searchBottleImages(@Query('query') query: string) {
    return this.spiritsService.searchBottleImages(query);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search spirits by name or distillery' })
  @ApiQuery({ name: 'q', required: true })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async searchSpirits(@Query('q') query: string) {
    return this.spiritsService.searchSpirits(query);
  }

  @Get('resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve an AI-identified bottle name to a catalog spirit (fuzzy)' })
  @ApiQuery({ name: 'name', required: true })
  @ApiQuery({ name: 'distillery', required: false })
  @ApiResponse({ status: 200, description: 'Resolution result' })
  async resolveSpirit(
    @Query('name') name: string,
    @Query('distillery') distillery: string,
    @Request() req: any,
  ) {
    return this.spiritsService.resolveSpirit(name, distillery, req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new spirit' })
  @ApiResponse({ status: 201, description: 'Spirit created successfully' })
  async createSpirit(@Body() dto: CreateSpiritDto) {
    return this.spiritsService.createSpirit(dto);
  }

  @Get(':id/pour-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Total pours of this spirit across all users' })
  @ApiResponse({ status: 200, description: 'Pour count retrieved' })
  async getPourCount(@Param('id') id: string) {
    return this.spiritsService.getPourCount(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get spirit details by ID (incl. community stats)' })
  @ApiResponse({ status: 200, description: 'Spirit details retrieved' })
  @ApiResponse({ status: 404, description: 'Spirit not found' })
  async getSpirit(@Param('id') id: string, @Request() req: any) {
    // Identity comes from the JWT (not a query param) so connections can't be spoofed
    return this.spiritsService.getSpirit(id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update spirit details' })
  @ApiResponse({ status: 200, description: 'Spirit updated successfully' })
  @ApiResponse({ status: 404, description: 'Spirit not found' })
  async updateSpirit(@Param('id') id: string, @Body() dto: UpdateSpiritDto) {
    return this.spiritsService.updateSpirit(id, dto);
  }
}

// Old DistilleriesController moved to src/distilleries/distilleries.controller.ts
// This has been replaced by the full Distillery Profiles feature