"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketConfig = getBucketConfig;
exports.createS3Client = createS3Client;
const client_s3_1 = require("@aws-sdk/client-s3");
function getBucketConfig() {
    return {
        bucketName: process.env.AWS_BUCKET_NAME ?? '',
        folderPrefix: process.env.AWS_FOLDER_PREFIX ?? '',
    };
}
function createS3Client() {
    return new client_s3_1.S3Client({});
}
//# sourceMappingURL=aws-config.js.map