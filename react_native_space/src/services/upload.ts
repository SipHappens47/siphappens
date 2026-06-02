import { apiService } from './api';
import { FileUploadResponse } from '../types';

export const uploadService = {
  async uploadImage(uri: string, fileName: string, isPublic: boolean = false): Promise<string> {
    try {
      const fileExtension = fileName?.split('.')?.pop()?.toLowerCase() ?? 'jpg';
      const contentType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

      // Step 1: Get presigned URL from backend
      console.log('Requesting presigned URL for:', fileName, 'isPublic:', isPublic);
      const presignedData = await apiService.getPresignedUrl({
        fileName: fileName ?? 'image.jpg',
        contentType,
        isPublic,
      });

      console.log('Presigned data received:', presignedData);

      if (!presignedData?.uploadUrl || !presignedData?.cloud_storage_path) {
        console.error('Invalid presigned data:', presignedData);
        throw new Error('Failed to get presigned URL');
      }

      // Step 2: Get file blob
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      const fileSize = blob?.size ?? 0;

      // Step 3: Upload to S3 using presigned URL
      const uploadUrl = new URL(presignedData.uploadUrl);
      const signedHeaders = uploadUrl.searchParams.get('X-Amz-SignedHeaders');
      
      const uploadHeaders: HeadersInit = {
        'Content-Type': contentType,
      };

      if (signedHeaders?.includes('content-disposition')) {
        uploadHeaders['Content-Disposition'] = 'attachment';
      }

      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: blob,
      });

      if (!uploadResponse?.ok) {
        throw new Error(`Upload failed: ${uploadResponse?.status ?? 'Unknown error'}`);
      }

      // Step 4: Complete upload and get file ID
      const completeResult = await apiService.completeUpload({
        cloud_storage_path: presignedData.cloud_storage_path,
        fileName: fileName ?? 'image.jpg',
        mimeType: contentType,
        fileSize,
      });

      return completeResult?.id ?? '';
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async getImageUrl(fileId: string, mode: 'view' | 'download' = 'view'): Promise<string> {
    try {
      const response = await apiService.getFileUrl(fileId, mode);
      return response?.url ?? '';
    } catch (error) {
      console.error('Get image URL error:', error);
      return '';
    }
  },
};
