import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: Record<string, string> | string[];
  timestamp: string;
}

/**
 * Response Formatter สำหรับทำให้ API Response มีรูปแบบเดียวกันทั้งหมด
 */
export class ResponseFormatter {
  /**
   * สร้าง success response ในรูปแบบมาตรฐาน
   */
  static success<T = any>(res: Response, data: T, message: string = "Operation successful", statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      status: statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * สร้าง error response ในรูปแบบมาตรฐาน
   */
  static error(res: Response, message: string = "An error occurred", statusCode: number = 500, errors?: Record<string, string> | string[]): Response {
    const response: ApiResponse = {
      success: false,
      status: statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * สร้าง not found response ในรูปแบบมาตรฐาน
   */
  static notFound(res: Response, message: string = "Resource not found", entity: string = "Resource"): Response {
    return this.error(res, message || `${entity} not found`, 404);
  }

  /**
   * สร้าง validation error response ในรูปแบบมาตรฐาน
   */
  static validationError(res: Response, errors: Record<string, string> = {}, message: string = "Validation failed"): Response {
    return this.error(res, message, 400, errors);
  }

  /**
   * สร้าง unauthorized response ในรูปแบบมาตรฐาน
   */
  static unauthorized(res: Response, message: string = "Unauthorized access"): Response {
    return this.error(res, message, 401);
  }
}
