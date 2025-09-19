import { Request, Response } from "express";
import { logger } from "@/utils/logger";
import { TypedRequestBody } from "@/utils/request";
import { Product } from "@/types/products";
import { ProductService } from "@/services/product.service";
import { ResponseFormatter } from "@/utils/response";
import { BUCKET_NAME, minioClient } from "@/utils/minio";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }
  public listProducts = async (req: Request, res: Response) => {
    try {
      // รับ page / limit จาก query (ค่า default: page=1, limit=10)
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // เรียก method listProducts() ของ service
      const result = await this.productService.listProducts(page, limit);

      return ResponseFormatter.success(
        res,
        result,
        "List products successfully"
      );
    } catch (err) {
      logger.error("List product failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public createProduct = async (
    req: TypedRequestBody<Product>,
    res: Response
  ) => {
    try {
      const data: Product = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ message: "Please upload at least 1 image" });
      }
      if (files.length > 3) {
        return res
          .status(400)
          .json({ message: "You can upload maximum 3 images" });
      }

      // อัปโหลดไฟล์ไป MinIO
      const imagesWithUrls = await Promise.all(
        files.map(async (file) => {
          const objectName = `${Date.now()}_${file.originalname}`;
          await minioClient.putObject(BUCKET_NAME, objectName, file.buffer);
          const url = `${process.env.MINIO_BASE_URL}/${BUCKET_NAME}/${objectName}`;
          return { image_url: url };
        })
      );

      // เรียก service สร้าง product พร้อม images URL
      const result = await this.productService.createProduct(
        data,
        imagesWithUrls
      );

      return ResponseFormatter.success(
        res,
        result,
        "Product created successfully"
      );
    } catch (err) {
      logger.error("Create product failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  // ดึง product พร้อม presigned URL ของรูป

  public readProduct = async (req: Request, res: Response) => {
    try {
      const product_id = Number(req.params.id);
      if (isNaN(product_id)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      const product = await this.productService.readProductWithPresignedUrl(
        product_id
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json({
        message: "Product fetched successfully",
        data: product,
      });
    } catch (err) {
      logger.error("Read product failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
