import { Controller, Get, Put, Post, Delete, Body, UseGuards, Request, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { PushTokenDto } from './dto/push-token.dto';

@ApiTags('Profile')
@Controller('api/profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.userId);
  }

  @Get('experience-breakdown')
  @ApiOperation({ summary: 'Current experience stats and what is needed for the next level' })
  @ApiResponse({ status: 200, description: 'Breakdown retrieved successfully' })
  async getExperienceBreakdown(@Request() req: any) {
    return this.profileService.getExperienceBreakdown(req.user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get public user profile by ID' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved successfully' })
  async getPublicProfile(@Param('userId') userId: string) {
    return this.profileService.getPublicProfile(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.userId, dto);
  }

  @Put('photo')
  @ApiOperation({ summary: 'Update profile photo' })
  @ApiResponse({ status: 200, description: 'Profile photo updated successfully' })
  async updatePhoto(@Request() req: any, @Body() dto: UpdatePhotoDto) {
    return this.profileService.updatePhoto(req.user.userId, dto);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register Expo push notification token' })
  @ApiResponse({ status: 201, description: 'Push token saved' })
  async savePushToken(@Request() req: any, @Body() dto: PushTokenDto) {
    return this.profileService.savePushToken(req.user.userId, dto.token);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete the current user account and all their data' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteAccount(@Request() req: any) {
    return this.profileService.deleteAccount(req.user.userId);
  }
}