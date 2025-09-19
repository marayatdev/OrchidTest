import multer from "multer";

// เก็บไฟล์ใน memory ก่อนส่งไป MinIO
export const upload = multer({ storage: multer.memoryStorage() });
