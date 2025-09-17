import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "@/utils/logger";
import { ResponseFormatter } from "@/utils/response";

// ขยาย interface ของ Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role?: string }; // ใช้ type ที่ตรงกับข้อมูลที่เราคาดหวัง
    }
  }
}

// ตรวจสอบ Access Token และ Refresh Token
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ตรวจสอบการมีอยู่ของ Access Token ใน Cookie
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      // ถ้าไม่มี accessToken จะพยายามใช้ refreshToken
      res.status(401).json({ message: "No access token found" });
      return;
    }

    // ตรวจสอบว่า accessToken valid หรือไม่
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || "") as {
        id: string;
        role: string;
      }; // type assertion
      req.user = decoded; // ใส่ข้อมูล user ที่มี id และ role ลงใน req
      return next();
    } catch (err) {
      // ถ้า accessToken หมดอายุ จะพยายามใช้ refreshToken เพื่อขอ Access Token ใหม่
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ message: "No refresh token found" });
        return;
      }

      // ถ้า refreshToken มี ก็ตรวจสอบว่า valid หรือไม่
      try {
        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.REFRESH_SECRET || ""
        ) as { id: string }; // type assertion
        const userId = decodedRefresh.id; // รับ user ID จาก refreshToken

        // ถ้า refreshToken valid, สร้าง accessToken ใหม่
        const newAccessToken = jwt.sign(
          { id: userId },
          process.env.JWT_SECRET || "",
          { expiresIn: "15m" }
        );

        // ส่ง accessToken ใหม่ไปใน Cookie
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // ต้องตั้ง `secure` สำหรับ prod
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 นาที
        });

        // เพิ่มข้อมูล user ลงใน request และไปที่ route ถัดไป
        req.user = decodedRefresh;
        return next();
      } catch (err) {
        // ถ้า refreshToken หมดอายุหรือ invalid ให้ logout ทันที
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        logger.error("Token refresh failed:", err);
        res
          .status(401)
          .json({ message: "Session expired, please login again" });
        return;
      }
    }
  } catch (err) {
    logger.error("Auth middleware error:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
