import { AuthController } from "@/controllers/auth.controller";
import { Router } from "express";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { validate } from "@/middlewares/validate";
import { LoginSchema, RegisterSchema } from "@/schemas/auth.schema";

const router = Router();
const authController = new AuthController();

router.post("/register", validate(RegisterSchema), authController.register);
router.post("/login", validate(LoginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);

export default router;
