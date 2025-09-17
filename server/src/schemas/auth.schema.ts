import { z } from "zod";

export const RegisterSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  role_id: z.int().min(1, { message: "Role ID is required" }),
});

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Invalid username" })
    .nonempty("username is required"),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .nonempty("Password is required"),
});
