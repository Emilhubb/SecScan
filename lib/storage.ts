import { S3Client } from "@aws-sdk/client-s3";

export const storage = new S3Client({ forcePathStyle: true });
export const storageBucket = process.env.S3_BUCKET ?? "uploads";
