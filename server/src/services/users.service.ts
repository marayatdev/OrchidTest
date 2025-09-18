import { User, UserUpdate } from "@/types/users";
import { PrismaClient, users } from "@prisma/client";

export class UserService {
  private prisma = new PrismaClient();

  public async updateUser(data: UserUpdate): Promise<users | null> {
    const { id, old_password, ...updateData } = data;

    return this.prisma.users.update({
      where: { id },
      data: updateData,
    });
  }

  public async findUserById(id: number): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }
}
