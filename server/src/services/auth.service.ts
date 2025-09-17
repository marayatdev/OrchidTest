import { User } from "@/types/users";
import { PrismaClient, users } from "@prisma/client";

export class AuthService {
  private prisma = new PrismaClient();

  public async getUserByEmail(email: string): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }
  public async registerUser(data: User): Promise<users> {
    return this.prisma.users.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        role_id: Number(data.role_id),
      },
    });
  }
}
