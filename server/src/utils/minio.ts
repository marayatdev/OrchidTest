import { Client } from "minio";
import { logger } from "@/utils/logger"; // สมมติคุณมี logger ของโปรเจค

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT!),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export const BUCKET_NAME = "orchid-test";

async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME);
      logger.info(`✅ Bucket "${BUCKET_NAME}" created`);
    } else {
      logger.info(`ℹ️  Bucket "${BUCKET_NAME}" already exists`);
    }

    // ทดสอบ MinIO ว่าสามารถเชื่อมต่อได้
    await minioClient.listBuckets();
    logger.info(`🚀 MinIO is ready and connected`);
  } catch (err) {
    logger.error(
      `❌ Error checking/creating bucket or connecting to MinIO:`,
      err
    );
  }
}

// เรียกใช้งาน
ensureBucket();
