import { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import { logger } from "@/utils/logger";
import { TypedRequestBody } from "@/utils/request";
import { ResponseFormatter } from "@/utils/response";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { User } from "@/types/users";

export class AuthController {
  private authService: AuthService;
  private jwtSecret: string;
  private refreshSecret: string;

  private generateAccessToken = (user: User) => {
    return jwt.sign({ id: user.id, role: user.role_id }, this.jwtSecret, {
      expiresIn: "15m",
    });
  };

  private generateRefreshToken = (user: User) => {
    return jwt.sign({ id: user.id, role: user.role_id }, this.refreshSecret, {
      expiresIn: "7d",
    });
  };

  constructor() {
    this.authService = new AuthService();
    this.jwtSecret = process.env.JWT_SECRET || "bovhoeivfoebwfvbeifpwbqe";
    this.refreshSecret =
      process.env.REFRESH_SECRET || "bovhoeivfoebwfvbeifpwbqe";
  }

  public register = async (req: TypedRequestBody<User>, res: Response) => {
    try {
      const data: User = req.body;

      if (!data.username || !data.email || !data.password || !data.role_id) {
        ResponseFormatter.notFound(res, "Missing required fields");
        return;
      }

      const existingUser = await this.authService.getUserByEmail(data.email);
      if (existingUser) {
        ResponseFormatter.validationError(res, {
          email: "Email already exists",
        });
      }

      const hashedPassword = await argon2.hash(data.password);

      const newUser = {
        ...data,
        password: hashedPassword,
      };

      const user = await this.authService.registerUser(newUser);

      if (!user) {
        ResponseFormatter.validationError(res, {
          email: "User creation failed",
        });
      }

      const { password: _, ...userData } = user;

      ResponseFormatter.success(res, userData, "User created successfully");
    } catch (err) {
      logger.error("Create user failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public login = async (req: TypedRequestBody<User>, res: Response) => {
    try {
      const data = req.body;

      const user = await this.authService.getUserByEmail(data.username);

      if (!user?.password || !user.username || !user.email || !user.role_id) {
        ResponseFormatter.validationError(res, {
          email: "Invalid credentials",
          username: "Invalid credentials",
          password: "Invalid credentials",
        });
        return;
      }

      const isPasswordValid = await argon2.verify(user.password, data.password);
      if (!isPasswordValid) {
        ResponseFormatter.validationError(res, {
          email: "Invalid credentials",
        });
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      ResponseFormatter.success(res, accessToken, "Login successful");
    } catch (err) {
      logger.error("Login failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public refresh = async (req: Request, res: Response) => {
    try {
      const token = req.cookies.refreshToken;

      if (!token) {
        res.status(401).json({ message: "No refresh token" });
        return;
      }

      const payload = jwt.verify(token, this.refreshSecret) as { id: number };
      const user = await this.authService.getUserById(payload.id);

      if (!user) throw new Error("User not found");
      if (!user) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      const newAccessToken = this.generateAccessToken(user);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      ResponseFormatter.success(
        res,
        { accessToken: newAccessToken },
        "Token refreshed"
      );
    } catch (err) {
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      logger.error("Token refresh failed:", err);
      res.status(401).json({ message: "Session expired" });
      return;
    }
  };

  public logout = async (req: Request, res: Response) => {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ message: "Logged out successfully" });
      return;
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ message: "Logout failed" });
      return;
    }
  };

  public me = async (req: Request, res: Response) => {
    try {
      const token = req.cookies.refreshToken;

      if (!token) {
        res.status(401).json({ message: "No refresh token" });
        return;
      }

      const payload = jwt.verify(token, this.refreshSecret) as { id: number };
      const user = await this.authService.getUserById(payload.id);
      if (!user) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;
      ResponseFormatter.success(res, userWithoutPassword, "Fetch user success");
    } catch (err) {
      logger.error("Fetch user failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
