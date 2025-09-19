import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { validate } from "@/middlewares/validate";
import { upload } from "@/middlewares/multer";

const router = Router();
const productController = new ProductController();

router.post("/", upload.array("images", 3), productController.createProduct);
router.get("/", productController.listProducts);
router.get("/:id", productController.readProduct);

export default router;
