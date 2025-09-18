import { Request, Response } from "express";
import { logger } from "@/utils/logger";
import { TypedRequestBody } from "@/utils/request";
import { Product } from "@/types/products";

export class ProductController {
  // private productService: ProductService;

  constructor() {}

  public createProduct = async (
    req: TypedRequestBody<Product>,
    res: Response
  ) => {
    try {
      const data: Product = req.body;
    } catch (err) {
      logger.error("Create product failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
