export type User = {
  id?: number;
  username: string;
  email: string;
  password: string;
  role_id: number;
};

export type UserUpdate = Partial<Omit<User, "id">> & {
  id: number;
  old_password?: string; // ใช้ตอน verify password เก่า
};
