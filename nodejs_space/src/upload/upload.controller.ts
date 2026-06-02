import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { GetPartUrlDto } from './dto/get-part-url.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Generate presigned URL for single-part upload (<= 100MB)' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  async getPresignedUrl(@Request() req: any, @Body() dto: PresignedUploadDto) {
    try {
      console.log('Controller: Received presigned URL request, userId:', req?.user?.userId, 'dto:', dto);
      const result = await this.uploadService.generatePresignedUrl(req.user.userId, dto);
      console.log('Controller: Presigned URL generated successfully');
      return result;
    } catch (error) {
      console.error('Controller: Error generating presigned URL:', error);
      throw error;
    }
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete upload and save file metadata to database' })
  @ApiResponse({ status: 201, description: 'File upload completed' })
  async completeUpload(@Request() req: any, @Body() dto: CompleteUploadDto) {
    return this.uploadService.completeUpload(req.user.userId, dto);
  }

  @Post('multipart/initiate')
  @ApiOperation({ summary: 'Initiate multipart upload (>100MB)' })
  @ApiResponse({ status: 200, description: 'Multipart upload initiated' })
  async initiateMultipart(@Request() req: any, @Body() dto: InitiateMultipartDto) {
    return this.uploadService.initiateMultipart(req.user.userId, dto);
  }

  @Post('multipart/part')
  @ApiOperation({ summary: 'Get presigned URL for uploading a part' })
  @ApiResponse({ status: 200, description: 'Presigned URL for part generated' })
  async getPartUrl(@Request() req: any, @Body() dto: GetPartUrlDto) {
    return this.uploadService.getPartUrl(req.user.userId, dto);
  }

  @Post('multipart/complete')
  @ApiOperation({ summary: 'Complete multipart upload' })
  @ApiResponse({ status: 201, description: 'Multipart upload completed' })
  async completeMultipart(@Request() req: any, @Body() dto: CompleteMultipartDto) {
    return this.uploadService.completeMultipart(req.user.userId, dto);
  }

  @Get('files/:id/url')
  @ApiOperation({ summary: 'Get file URL (public or signed)' })
  @ApiQuery({ name: 'mode', enum: ['view', 'download'], required: false })
  @ApiResponse({ status: 200, description: 'File URL retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileUrl(
    @Request() req: any,
    @Param('id') id: string,
    @Query('mode') mode: 'view' | 'download' = 'view',
  ) {
    return this.uploadService.getFileUrl(req.user.userId, id, mode);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete file from S3 and database' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Request() req: any, @Param('id') id: string) {
    return this.uploadService.deleteFile(req.user.userId, id);
  }
}