import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

let s3Client: ReturnType<typeof createS3Client> | null = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false,
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const client = getS3Client();
  const { bucketName, folderPrefix } = getBucketConfig();

  const prefix = isPublic ? 'public/uploads/' : 'uploads/';
  const cloud_storage_path = `${folderPrefix}${prefix}${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    // Don't set ContentDisposition - let files display inline by default (not force download)
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return { uploadUrl, cloud_storage_path };
}

export async function initiateMultipartUpload(
  fileName: string,
  isPublic = false,
): Promise<{ uploadId: string; cloud_storage_path: string }> {
  const client = getS3Client();
  const { bucketName, folderPrefix } = getBucketConfig();

  const prefix = isPublic ? 'public/uploads/' : 'uploads/';
  const cloud_storage_path = `${folderPrefix}${prefix}${Date.now()}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    // Don't set ContentDisposition - let files display inline by default (not force download)
  });

  const result = await client.send(command);

  if (!result.UploadId) {
    throw new Error('Failed to initiate multipart upload');
  }

  return { uploadId: result.UploadId, cloud_storage_path };
}

export async function getPresignedUrlForPart(
  cloud_storage_path: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  const client = getS3Client();
  const { bucketName } = getBucketConfig();

  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function completeMultipartUpload(
  cloud_storage_path: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
): Promise<void> {
  const client = getS3Client();
  const { bucketName } = getBucketConfig();

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  await client.send(command);
}

export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean,
  mode: 'view' | 'download' = 'view',
): Promise<string> {
  const { bucketName } = getBucketConfig();
  const client = getS3Client();
  
  // Always generate signed URLs to control Content-Disposition via ResponseContentDisposition
  // This overrides any ContentDisposition metadata set on the object during upload
  // For view mode, use inline disposition; for download mode, use attachment
  const disposition = mode === 'download' ? 'attachment' : 'inline';
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: disposition,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string): Promise<void> {
  const client = getS3Client();
  const { bucketName } = getBucketConfig();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  await client.send(command);
}