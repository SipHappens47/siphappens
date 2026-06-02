export declare function generatePresignedUploadUrl(fileName: string, contentType: string, isPublic?: boolean): Promise<{
    uploadUrl: string;
    cloud_storage_path: string;
}>;
export declare function initiateMultipartUpload(fileName: string, isPublic?: boolean): Promise<{
    uploadId: string;
    cloud_storage_path: string;
}>;
export declare function getPresignedUrlForPart(cloud_storage_path: string, uploadId: string, partNumber: number): Promise<string>;
export declare function completeMultipartUpload(cloud_storage_path: string, uploadId: string, parts: {
    ETag: string;
    PartNumber: number;
}[]): Promise<void>;
export declare function getFileUrl(cloud_storage_path: string, isPublic: boolean, mode?: 'view' | 'download'): Promise<string>;
export declare function deleteFile(cloud_storage_path: string): Promise<void>;
