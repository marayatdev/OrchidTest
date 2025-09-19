import { PrismaClient } from "@prisma/client";
import { Product, ProductWithImages } from "@/types/products";
import { BUCKET_NAME, minioClient } from "@/utils/minio";

export class ProductService {
  private prisma = new PrismaClient();

  public async listProducts(
    page: number,
    limit: number
  ): Promise<{
    data: ProductWithImages[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    // นับจำนวนทั้งหมด
    const total = await this.prisma.products.count();

    // ดึงรายการตาม pagination
    const products = await this.prisma.products.findMany({
      skip,
      take: limit,
      include: {
        product_images: true,
      },
      orderBy: {
        id: "desc", // เรียงล่าสุดก่อน
      },
    });

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name || "",
        description: p.description || "",
        price: p.price?.toNumber() || 0,
        images: p.product_images.map((img) => ({
          id: img.id,
          product_id: img.product_id || 0,
          image_url: img.image_url || "",
        })),
      })),
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  public async createProduct(
    productData: Product,
    images: { image_url: string }[]
  ): Promise<{ productId: number }> {
    const result = await this.prisma.$transaction(async (tx) => {
      // สร้าง product
      const product = await tx.products.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
        },
      });

      // สร้าง product_images
      const imagesData = images.map((img) => ({
        product_id: product.id,
        image_url: img.image_url, // เก็บ URL จาก MinIO
      }));

      await tx.product_images.createMany({
        data: imagesData,
      });

      return { productId: product.id };
    });

    return result;
  }

  public async readProduct(productId: number) {
    // ดึง product พร้อม relation product_images
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      include: { product_images: true }, // ดึงรูปภาพทั้งหมด
    });

    if (!product) return null;

    // จัดโครงสร้าง response (optional)
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      createdAt: product.createdAt,
      images: product.product_images.map((img) => img.image_url),
    };
  }

  // ดึง product พร้อม presigned URL
  public async readProductWithPresignedUrl(productId: number) {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      include: { product_images: true },
    });
    if (!product) return null;

    const images = await Promise.all(
      product.product_images
        .filter((img) => img.image_url)
        .map(async (img) => {
          const objectName = img.image_url!.split(`${BUCKET_NAME}/`)[1];
          const url = await minioClient.presignedGetObject(
            BUCKET_NAME,
            objectName,
            60 * 60
          );
          return url;
        })
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      createdAt: product.createdAt,
      images: images.filter(Boolean),
    };
  }

  // ดึง product + images
  public async getProductWithImages(productId: number) {
    return this.prisma.products.findUnique({
      where: { id: productId },
      include: { product_images: true },
    });
  }

  // ลบรูปออกจาก DB
  public async deleteProductImages(ids: number[]) {
    return this.prisma.product_images.deleteMany({
      where: { id: { in: ids } },
    });
  }

  // อัปเดต product
  public async updateProduct(
    productId: number,
    data: { name: string; description: string; price: number }
  ) {
    return this.prisma.products.update({
      where: { id: productId },
      data,
    });
  }

  // เพิ่มรูปใหม่เข้า DB
  public async addProductImages(
    images: { product_id: number; image_url: string }[]
  ) {
    return this.prisma.product_images.createMany({ data: images });
  }

  public async getAllProductsRaw() {
    return this.prisma.products.findMany({
      include: { product_images: true },
      orderBy: { id: "desc" },
    });
  }

  public async removeProduct(productId: number) {
    return this.prisma.products.delete({
      where: { id: productId },
    });
  }
}
