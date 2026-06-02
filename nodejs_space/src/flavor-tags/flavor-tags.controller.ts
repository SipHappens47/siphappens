import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FlavorTagsService } from './flavor-tags.service';

@ApiTags('Flavor Tags')
@Controller('api/flavor-tags')
export class FlavorTagsController {
  constructor(private flavorTagsService: FlavorTagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available flavor tags' })
  @ApiResponse({ status: 200, description: 'Flavor tags retrieved successfully' })
  async getAllFlavorTags() {
    return this.flavorTagsService.getAllFlavorTags();
  }
}