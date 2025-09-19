import { Request, Response } from "express";
import { logger } from "@/utils/logger";
import { TypedRequestBody } from "@/utils/request";
import { Product } from "@/types/products";
import { ProductService } from "@/services/product.service";
import { ResponseFormatter } from "@/utils/response";
import { BUCKET_NAME, minioClient } from "@/utils/minio";
import fs from "fs";

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

  public updateProduct = async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.id);
      if (isNaN(productId))
        return res.status(400).json({ message: "Invalid product id" });

      const data = req.body;
      const files = (req.files as Express.Multer.File[]) || [];
      const oldImages: string[] = data.oldImages
        ? JSON.parse(data.oldImages)
        : [];

      // 1️⃣ ดึง product พร้อม images
      const product = await this.productService.getProductWithImages(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      // 2️⃣ หารูปที่ถูกลบ (รูปเก่าที่ไม่ได้อยู่ใน oldImages)
      const removedImages = product.product_images.filter(
        (img) => !oldImages.includes(img.image_url!)
      );

      // 3️⃣ ลบไฟล์จาก MinIO และ DB
      for (const img of removedImages) {
        if (img.image_url) {
          const objectName = img.image_url.split(`${BUCKET_NAME}/`)[1];
          try {
            await minioClient.removeObject(BUCKET_NAME, objectName);
          } catch (err) {
            logger.error("Failed to remove object from MinIO:", err);
          }
        }
      }

      if (removedImages.length > 0) {
        await this.productService.deleteProductImages(
          removedImages.map((i) => i.id)
        );
      }

      // 4️⃣ อัปเดตรายละเอียด product
      const updatedProduct = await this.productService.updateProduct(
        productId,
        {
          name: data.name,
          description: data.description,
          price: Number(data.price),
        }
      );

      // 5️⃣ อัปโหลดรูปใหม่ไป MinIO + สร้าง record ใน DB
      const newImagesData: { product_id: number; image_url: string }[] = [];
      for (const file of files) {
        const objectName = `${Date.now()}_${file.originalname}`;

        // ใช้ buffer แทน path เพราะ multer memoryStorage
        await minioClient.putObject(
          BUCKET_NAME,
          objectName,
          file.buffer,
          file.size
        );

        const imageUrl = `http://localhost:9000/${BUCKET_NAME}/${objectName}`;
        newImagesData.push({ product_id: productId, image_url: imageUrl });
      }

      if (newImagesData.length > 0) {
        await this.productService.addProductImages(newImagesData);
      }

      res.json({
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (err) {
      logger.error("Update product failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public readProduct = async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.id);
      if (isNaN(productId))
        return res.status(400).json({ message: "Invalid product id" });

      const product = await this.productService.readProductWithPresignedUrl(
        productId
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      res.json({ message: "Product fetched successfully", data: product });
    } catch (err) {
      logger.error("Read product failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public getProducts = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      // 1️⃣ ดึงข้อมูลดิบจาก DB
      const allProducts = await this.productService.getAllProductsRaw();

      // 2️⃣ กรองด้วย search (case-insensitive)
      let filtered = allProducts;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allProducts.filter((p) =>
          p.name?.toLowerCase().includes(searchLower)
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);

      // 3️⃣ สร้าง presigned URL สำหรับแต่ละรูป
      const data = await Promise.all(
        paginated.map(async (p) => {
          const imagesWithPresigned = await Promise.all(
            p.product_images.map(async (img) => {
              if (!img.image_url) return null;
              const objectName = img.image_url.split(`${BUCKET_NAME}/`)[1];
              const url = await minioClient.presignedGetObject(
                BUCKET_NAME,
                objectName,
                60 * 60
              );
              return { ...img, image_url: url };
            })
          );
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price: Number(p.price),
            images: imagesWithPresigned.filter(Boolean),
          };
        })
      );

      return ResponseFormatter.success(
        res,
        { data, total, totalPages, page, limit },
        "Products fetched successfully"
      );
    } catch (err) {
      logger.error("Fetch products failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public removeProduct = async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.id);

      if (isNaN(productId))
        return res.status(400).json({ message: "Invalid product id" });

      const deleteProduct = await this.productService.removeProduct(productId);

      res.json({ message: "Delete Product successfully", data: deleteProduct });
    } catch (err) {
      logger.error("Delete products failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
