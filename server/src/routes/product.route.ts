import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { validate } from "@/middlewares/validate";

const router = Router();
const productController = new ProductController();

router.post(
  "/",
  /* validate(RegisterSchema), */ productController.createProduct
);
// router.post("/login", validate(LoginSchema), authController.login);
// router.post("/refresh", authController.refresh);
// router.post("/logout", authMiddleware, authController.logout);
// router.get("/me", authMiddleware, authController.me);

export default router;
