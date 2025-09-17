import { PrismaClient } from "@prisma/client";
import { logger } from "@/utils/logger";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("✅ MySQL connected.");
  } catch (err) {
    logger.error("❌ Prisma connection failed:", err);
    process.exit(1);
  }
};
