import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportDto } from './dto/report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

@ApiTags('Moderation')
@Controller('api/moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Post('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a pour or a user for objectionable content' })
  @ApiResponse({ status: 200, description: 'Report submitted' })
  async report(@Request() req: any, @Body() dto: ReportDto) {
    return this.moderationService.reportContent(req.user.userId, dto);
  }

  @Post('block/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'User blocked' })
  async block(@Request() req: any, @Param('userId') userId: string) {
    return this.moderationService.blockUser(req.user.userId, userId);
  }

  @Delete('block/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked' })
  async unblock(@Request() req: any, @Param('userId') userId: string) {
    return this.moderationService.unblockUser(req.user.userId, userId);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'List user ids the current user has blocked' })
  @ApiResponse({ status: 200, description: 'Blocked user ids' })
  async blocks(@Request() req: any) {
    return this.moderationService.getMyBlocks(req.user.userId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List reports for review (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reports list' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async reports(@Request() req: any, @Query('status') status?: string) {
    return this.moderationService.listReports(req.user.userId, status);
  }

  @Post('reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a report: dismiss, delete content, or ban user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async resolve(@Request() req: any, @Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.moderationService.resolveReport(req.user.userId, id, dto);
  }
}
