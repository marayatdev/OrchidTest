import { Response } from "express";
import { logger } from "@/utils/logger";
import { TypedRequestBody } from "@/utils/request";
import { UserUpdate } from "@/types/users";
import { ResponseFormatter } from "@/utils/response";
import { UserService } from "@/services/users.service";
import * as argon2 from "argon2";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public updateUser = async (
    req: TypedRequestBody<UserUpdate>,
    res: Response
  ) => {
    try {
      const data: UserUpdate = req.body;

      if (data.password && !data.old_password) {
        return ResponseFormatter.error(
          res,
          "Old password is required to change password",
          400
        );
      }

      if (data.password && data.old_password) {
        const user = await this.userService.findUserById(data.id);
        if (!user) {
          return ResponseFormatter.notFound(res, "User not found");
        }

        const validOldPassword = await argon2.verify(
          user.password,
          data.old_password
        );

        if (!validOldPassword) {
          return ResponseFormatter.error(res, "Old password is incorrect", 400);
        }

        data.password = await argon2.hash(data.password);
      }

      const updatedUser = await this.userService.updateUser(data);

      if (!updatedUser) {
        return ResponseFormatter.notFound(res, "User not found");
      }

      return ResponseFormatter.success(
        res,
        updatedUser,
        "User updated successfully"
      );
    } catch (err) {
      logger.error("Update user failed:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
