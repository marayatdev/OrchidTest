import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { validate } from "@/middlewares/validate";
import { upload } from "@/middlewares/multer";

const router = Router();
const productController = new ProductController();

router.post("/", upload.array("images", 3), productController.createProduct);
router.get("/all-product", productController.getProducts);
router.delete("/:id", productController.removeProduct);
router.get("/", productController.listProducts);
router.get("/:id", productController.readProduct);
router.put("/:id", upload.array("images", 3), productController.updateProduct);

export default router;
