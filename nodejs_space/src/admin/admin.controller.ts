import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('distilleries/unverified')
  @ApiOperation({ summary: 'Get all unverified distilleries (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of unverified distilleries' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getUnverifiedDistilleries(@Request() req: any) {
    await this.adminService.checkAdminAccess(req.user.userId);
    return this.adminService.getUnverifiedDistilleries();
  }

  @Post('distilleries/:id/verify')
  @ApiOperation({ summary: 'Verify a distillery (Admin only)' })
  @ApiResponse({ status: 200, description: 'Distillery verified successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Distillery not found' })
  async verifyDistillery(@Param('id') id: string, @Request() req: any) {
    return this.adminService.verifyDistillery(id, req.user.userId);
  }

  @Post('distilleries/:id/reject')
  @ApiOperation({ summary: 'Reject a distillery (Admin only)' })
  @ApiResponse({ status: 200, description: 'Distillery rejected successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Distillery not found' })
  async rejectDistillery(@Param('id') id: string, @Request() req: any) {
    return this.adminService.rejectDistillery(id, req.user.userId);
  }
}
