import "tsconfig-paths/register";
import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import cookieParser from "cookie-parser";
import fs from "fs";
import { logger } from "./utils/logger";
import { connectDB } from "./config/prisma";
import dotenv from "dotenv";

dotenv.config();

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.setMiddlewares();
    this.setRoutes();
    this.port = Number(process.env.PORT) || 4000;
  }

  private setMiddlewares(): void {
    this.app.use(
      cors({
        origin: "http://localhost:3000",
        credentials: true,
      })
    );
    this.app.use(morgan("dev"));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use("/api/health", (_, res) => {
      res.json({ status: "ok" });
    });
  }

  private setRoutes(): void {
    const routesPath = path.join(__dirname, "routes");
    const isTs = __filename.endsWith(".ts");
    const extension = isTs ? ".ts" : ".js";

    fs.readdirSync(routesPath).forEach((file) => {
      if (file.endsWith(extension)) {
        const routeModulePath = path.join(routesPath, file);
        const route = require(routeModulePath).default;

        if (route) {
          const routeName = file.replace(/\.route\.(ts|js)$/, "");
          this.app.use(`/api/${routeName}`, route);
        }
      }
    });
  }

  public async listen(): Promise<void> {
    try {
      await connectDB();
      this.app.listen(this.port, () => {
        logger.info(`🚀 Server is running on http://localhost:${this.port}`);
      });
    } catch (error) {
      logger.error("❌ Failed to start server:", error);
    }
  }
}

const app = new App();
app.listen();
