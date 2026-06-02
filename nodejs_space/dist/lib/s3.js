"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePresignedUploadUrl = generatePresignedUploadUrl;
exports.initiateMultipartUpload = initiateMultipartUpload;
exports.getPresignedUrlForPart = getPresignedUrlForPart;
exports.completeMultipartUpload = completeMultipartUpload;
exports.getFileUrl = getFileUrl;
exports.deleteFile = deleteFile;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const aws_config_1 = require("./aws-config");
let s3Client = null;
function getS3Client() {
    if (!s3Client) {
        s3Client = (0, aws_config_1.createS3Client)();
    }
    return s3Client;
}
async function generatePresignedUploadUrl(fileName, contentType, isPublic = false) {
    const client = getS3Client();
    const { bucketName, folderPrefix } = (0, aws_config_1.getBucketConfig)();
    const prefix = isPublic ? 'public/uploads/' : 'uploads/';
    const cloud_storage_path = `${folderPrefix}${prefix}${Date.now()}-${fileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        ContentType: contentType,
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn: 3600 });
    return { uploadUrl, cloud_storage_path };
}
async function initiateMultipartUpload(fileName, isPublic = false) {
    const client = getS3Client();
    const { bucketName, folderPrefix } = (0, aws_config_1.getBucketConfig)();
    const prefix = isPublic ? 'public/uploads/' : 'uploads/';
    const cloud_storage_path = `${folderPrefix}${prefix}${Date.now()}-${fileName}`;
    const command = new client_s3_1.CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
    });
    const result = await client.send(command);
    if (!result.UploadId) {
        throw new Error('Failed to initiate multipart upload');
    }
    return { uploadId: result.UploadId, cloud_storage_path };
}
async function getPresignedUrlForPart(cloud_storage_path, uploadId, partNumber) {
    const client = getS3Client();
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const command = new client_s3_1.UploadPartCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        UploadId: uploadId,
        PartNumber: partNumber,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn: 3600 });
}
async function completeMultipartUpload(cloud_storage_path, uploadId, parts) {
    const client = getS3Client();
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const command = new client_s3_1.CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
    });
    await client.send(command);
}
async function getFileUrl(cloud_storage_path, isPublic, mode = 'view') {
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const client = getS3Client();
    const disposition = mode === 'download' ? 'attachment' : 'inline';
    const command = new client_s3_1.GetObjectCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
        ResponseContentDisposition: disposition,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn: 3600 });
}
async function deleteFile(cloud_storage_path) {
    const client = getS3Client();
    const { bucketName } = (0, aws_config_1.getBucketConfig)();
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: bucketName,
        Key: cloud_storage_path,
    });
    await client.send(command);
}
//# sourceMappingURL=s3.js.map