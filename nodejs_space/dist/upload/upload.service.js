"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const s3 = require("../lib/s3");
let UploadService = class UploadService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generatePresignedUrl(userId, dto) {
        console.log('Backend: generatePresignedUrl called for user:', userId, 'dto:', dto);
        const { fileName, contentType, isPublic = false } = dto;
        try {
            const { uploadUrl, cloud_storage_path } = await s3.generatePresignedUploadUrl(fileName, contentType, isPublic);
            console.log('Backend: Presigned URL generated successfully:', { cloud_storage_path, hasUploadUrl: !!uploadUrl });
            return {
                uploadUrl,
                cloud_storage_path,
                isPublic,
            };
        }
        catch (error) {
            console.error('Backend: Failed to generate presigned URL:', error);
            throw error;
        }
    }
    async completeUpload(userId, dto) {
        const { cloud_storage_path, fileName, mimeType, fileSize } = dto;
        const isPublic = cloud_storage_path.includes('/public/uploads/');
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
    async initiateMultipart(userId, dto) {
        const { fileName, isPublic = false } = dto;
        const { uploadId, cloud_storage_path } = await s3.initiateMultipartUpload(fileName, isPublic);
        return {
            uploadId,
            cloud_storage_path,
            isPublic,
        };
    }
    async getPartUrl(userId, dto) {
        const { cloud_storage_path, uploadId, partNumber } = dto;
        const presignedUrl = await s3.getPresignedUrlForPart(cloud_storage_path, uploadId, partNumber);
        return {
            presignedUrl,
            partNumber,
        };
    }
    async completeMultipart(userId, dto) {
        const { cloud_storage_path, uploadId, parts, fileName, mimeType, fileSize } = dto;
        await s3.completeMultipartUpload(cloud_storage_path, uploadId, parts);
        const isPublic = cloud_storage_path.includes('/public/uploads/');
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
    async getFileUrl(userId, fileId, mode = 'view') {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: {
                pours: true,
            },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const isSharedPourImage = file.pours?.some((pour) => pour.isshared === true);
        const hasAccess = file.ispublic || file.userid === userId || isSharedPourImage;
        if (!hasAccess) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const url = await s3.getFileUrl(file.cloudstoragepath, file.ispublic, mode);
        return {
            url,
            fileName: file.filename,
            mimeType: file.mimetype,
        };
    }
    async deleteFile(userId, fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (file.userid !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await s3.deleteFile(file.cloudstoragepath);
        await this.prisma.file.delete({ where: { id: fileId } });
        return { message: 'File deleted successfully' };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadService);
//# sourceMappingURL=upload.service.js.map