import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as s3 from '../lib/s3';
import {
  buildUserStoragePath,
  canDeleteStorageObject,
  isOwnedStoragePath,
  isPublicStoragePath,
  isTrustedFileRecord,
} from './storage-ownership';
import { isBlockedBetween } from '../moderation/blocking';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { GetPartUrlDto } from './dto/get-part-url.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private prisma: PrismaService) {}

  // SH-C03: a caller may only register objects in its own namespace, and
  // each object only once.
  private assertOwnedPath(userId: string, cloud_storage_path: string) {
    if (!isOwnedStoragePath(userId, cloud_storage_path)) {
      throw new ForbiddenException('Upload path was not issued to this account');
    }
  }

  async generatePresignedUrl(userId: string, dto: PresignedUploadDto) {
    console.log('Backend: generatePresignedUrl called for user:', userId, 'dto:', dto);
    const { fileName, contentType, isPublic = false } = dto;

    try {
      const { uploadUrl, cloud_storage_path } = await s3.generatePresignedUploadUrl(
        buildUserStoragePath(userId, fileName, isPublic ? 'public' : 'private'),
        contentType,
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

    this.assertOwnedPath(userId, cloud_storage_path);
    const existing = await this.prisma.file.findFirst({
      where: { cloudstoragepath: cloud_storage_path },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This upload has already been completed');
    }

    const isPublic = isPublicStoragePath(cloud_storage_path);

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
    this.assertOwnedPath(userId, cloud_storage_path);

    const presignedUrl = await s3.getPresignedUrlForPart(cloud_storage_path, uploadId, partNumber);

    return {
      presignedUrl,
      partNumber,
    };
  }

  async completeMultipart(userId: string, dto: CompleteMultipartDto) {
    const { cloud_storage_path, uploadId, parts, fileName, mimeType, fileSize } = dto;
    this.assertOwnedPath(userId, cloud_storage_path);

    await s3.completeMultipartUpload(cloud_storage_path, uploadId, parts);

    const isPublic = isPublicStoragePath(cloud_storage_path);

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

    // A record registered against someone else's object grants nothing.
    if (!(await isTrustedFileRecord(this.prisma, file))) {
      throw new ForbiddenException('Access denied');
    }

    // SH-C02: pour photos and private files of a blocked user do not exist for the viewer.
    const blockable = (file.pours?.length ?? 0) > 0 || !file.ispublic;
    if (file.userid !== userId && blockable && (await isBlockedBetween(this.prisma, userId, file.userid))) {
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

    if (await canDeleteStorageObject(this.prisma, file)) {
      await s3.deleteFile(file.cloudstoragepath);
    } else {
      this.logger.warn(`Kept storage object for file ${file.id}: ownership not provable`);
    }
    await this.prisma.file.delete({ where: { id: fileId } });

    return { message: 'File deleted successfully' };
  }
}