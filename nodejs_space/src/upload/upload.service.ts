import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as s3 from '../lib/s3';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { GetPartUrlDto } from './dto/get-part-url.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async generatePresignedUrl(userId: string, dto: PresignedUploadDto) {
    console.log('Backend: generatePresignedUrl called for user:', userId, 'dto:', dto);
    const { fileName, contentType, isPublic = false } = dto;

    try {
      const { uploadUrl, cloud_storage_path } = await s3.generatePresignedUploadUrl(
        fileName,
        contentType,
        isPublic,
      );

      console.log('Backend: Presigned URL generated successfully:', { cloud_storage_path, hasUploadUrl: !!uploadUrl });

      return {
        uploadUrl,
        cloud_storage_path,
        isPublic,
      };
    } catch (error) {
      console.error('Backend: Failed to generate presigned URL:', error);
      throw error;
    }
  }

  async completeUpload(userId: string, dto: CompleteUploadDto) {
    const { cloud_storage_path, fileName, mimeType, fileSize } = dto;

    const isPublic = cloud_storage_path.includes('public/uploads/');

    const file = await this.prisma.file.create({
      data: {
        userid: userId,
        cloudstoragepath: cloud_storage_path,
        ispublic: isPublic,
        filename: fileName,
        filesize: fileSize,
        mimetype: mimeType,
      },
    });

    return {
      id: file.id,
      cloud_storage_path: file.cloudstoragepath,
      fileName: file.filename,
      isPublic: file.ispublic,
    };
  }

  async initiateMultipart(userId: string, dto: InitiateMultipartDto) {
    const { fileName, isPublic = false } = dto;

    const { uploadId, cloud_storage_path } = await s3.initiateMultipartUpload(fileName, isPublic);

    return {
      uploadId,
      cloud_storage_path,
      isPublic,
    };
  }

  async getPartUrl(userId: string, dto: GetPartUrlDto) {
    const { cloud_storage_path, uploadId, partNumber } = dto;

    const presignedUrl = await s3.getPresignedUrlForPart(cloud_storage_path, uploadId, partNumber);

    return {
      presignedUrl,
      partNumber,
    };
  }

  async completeMultipart(userId: string, dto: CompleteMultipartDto) {
    const { cloud_storage_path, uploadId, parts, fileName, mimeType, fileSize } = dto;

    await s3.completeMultipartUpload(cloud_storage_path, uploadId, parts);

    const isPublic = cloud_storage_path.includes('public/uploads/');

    const file = await this.prisma.file.create({
      data: {
        userid: userId,
        cloudstoragepath: cloud_storage_path,
        ispublic: isPublic,
        filename: fileName,
        filesize: fileSize,
        mimetype: mimeType,
      },
    });

    return {
      id: file.id,
      cloud_storage_path: file.cloudstoragepath,
      fileName: file.filename,
      isPublic: file.ispublic,
    };
  }

  async getFileUrl(userId: string, fileId: string, mode: 'view' | 'download' = 'view') {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        pours: true, // Include pours that use this image
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Allow access if:
    // 1. File is public, OR
    // 2. User is the file owner, OR
    // 3. File is a pour image for a shared pour
    const isSharedPourImage = file.pours?.some((pour: any) => pour.isshared === true);
    const hasAccess = file.ispublic || file.userid === userId || isSharedPourImage;

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    const url = await s3.getFileUrl(file.cloudstoragepath, file.ispublic, mode);

    return {
      url,
      fileName: file.filename,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.userid !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await s3.deleteFile(file.cloudstoragepath);
    await this.prisma.file.delete({ where: { id: fileId } });

    return { message: 'File deleted successfully' };
  }
}