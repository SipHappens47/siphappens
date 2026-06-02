import { PrismaService } from '../prisma/prisma.service';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { GetPartUrlDto } from './dto/get-part-url.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';
export declare class UploadService {
    private prisma;
    constructor(prisma: PrismaService);
    generatePresignedUrl(userId: string, dto: PresignedUploadDto): Promise<{
        uploadUrl: string;
        cloud_storage_path: string;
        isPublic: boolean;
    }>;
    completeUpload(userId: string, dto: CompleteUploadDto): Promise<{
        id: string;
        cloud_storage_path: string;
        fileName: string;
        isPublic: boolean;
    }>;
    initiateMultipart(userId: string, dto: InitiateMultipartDto): Promise<{
        uploadId: string;
        cloud_storage_path: string;
        isPublic: boolean;
    }>;
    getPartUrl(userId: string, dto: GetPartUrlDto): Promise<{
        presignedUrl: string;
        partNumber: number;
    }>;
    completeMultipart(userId: string, dto: CompleteMultipartDto): Promise<{
        id: string;
        cloud_storage_path: string;
        fileName: string;
        isPublic: boolean;
    }>;
    getFileUrl(userId: string, fileId: string, mode?: 'view' | 'download'): Promise<{
        url: string;
        fileName: string;
        mimeType: string;
    }>;
    deleteFile(userId: string, fileId: string): Promise<{
        message: string;
    }>;
}
