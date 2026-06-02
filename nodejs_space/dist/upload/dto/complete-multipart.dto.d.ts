declare class PartInfo {
    ETag: string;
    PartNumber: number;
}
export declare class CompleteMultipartDto {
    cloud_storage_path: string;
    uploadId: string;
    parts: PartInfo[];
    fileName: string;
    mimeType: string;
    fileSize: number;
}
export {};
