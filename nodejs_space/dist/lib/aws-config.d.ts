import { S3Client } from '@aws-sdk/client-s3';
export declare function getBucketConfig(): {
    bucketName: string;
    folderPrefix: string;
};
export declare function createS3Client(): S3Client;
