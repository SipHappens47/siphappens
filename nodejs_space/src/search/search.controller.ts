import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Search')
@Controller('api/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Universal search across all entities' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (minimum 2 characters)' })
  @ApiResponse({ status: 200, description: 'Grouped search results retrieved' })
  async universalSearch(@Query('q') query: string, @Request() req: any) {
    return this.searchService.universalSearch(query, req.user.userId);
  }
}
