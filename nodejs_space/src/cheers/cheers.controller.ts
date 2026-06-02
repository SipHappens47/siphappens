import { Controller, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheersService } from './cheers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Cheers')
@Controller('api/cheers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheersController {
  constructor(private cheersService: CheersService) {}

  @Post(':pourId')
  @ApiOperation({ summary: 'Add a cheer to a pour (Fellow Sippers only)' })
  @ApiResponse({ status: 201, description: 'Cheer added' })
  async addCheer(@Request() req: any, @Param('pourId') pourId: string) {
    return this.cheersService.addCheer(req.user.userId, pourId);
  }

  @Delete(':pourId')
  @ApiOperation({ summary: 'Remove your cheer from a pour' })
  @ApiResponse({ status: 200, description: 'Cheer removed' })
  async removeCheer(@Request() req: any, @Param('pourId') pourId: string) {
    return this.cheersService.removeCheer(req.user.userId, pourId);
  }
}
