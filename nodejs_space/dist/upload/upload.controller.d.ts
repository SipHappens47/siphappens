import { UploadService } from './upload.service';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { GetPartUrlDto } from './dto/get-part-url.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    getPresignedUrl(req: any, dto: PresignedUploadDto): Promise<{
        uploadUrl: string;
        cloud_storage_path: string;
        isPublic: boolean;
    }>;
    completeUpload(req: any, dto: CompleteUploadDto): Promise<{
        id: string;
        cloud_storage_path: string;
        fileName: string;
        isPublic: boolean;
    }>;
    initiateMultipart(req: any, dto: InitiateMultipartDto): Promise<{
        uploadId: string;
        cloud_storage_path: string;
        isPublic: boolean;
    }>;
    getPartUrl(req: any, dto: GetPartUrlDto): Promise<{
        presignedUrl: string;
        partNumber: number;
    }>;
    completeMultipart(req: any, dto: CompleteMultipartDto): Promise<{
        id: string;
        cloud_storage_path: string;
        fileName: string;
        isPublic: boolean;
    }>;
    getFileUrl(req: any, id: string, mode?: 'view' | 'download'): Promise<{
        url: string;
        fileName: string;
        mimeType: string;
    }>;
    deleteFile(req: any, id: string): Promise<{
        message: string;
    }>;
}
