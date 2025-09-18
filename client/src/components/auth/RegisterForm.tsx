"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import api from "@/lib/axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner";
const registerSchema = z
    .object({
        username: z.string().min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร"),
        email: z.string().email("Email ไม่ถูกต้อง"),
        password: z.string().min(6, "Password ต้องมีอย่างน้อย 6 ตัวอักษร"),
        confirmPassword: z.string(),
        role_id: z.number().min(1, "กรุณาเลือกบทบาท"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "รหัสผ่านไม่ตรงกัน",
        path: ["confirmPassword"],
    })

type RegisterFormData = z.infer<typeof registerSchema>
type RegisterFormProps = {
    onRegisterSuccess: () => void;
}

export default function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
    const router = useRouter()
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const response = await api.post('/auth/register', data);
            if (response.data.status === 200) {
                toast.success("สมัครสมาชิกสำเร็จ");
                onRegisterSuccess();
            }
        } catch (err) {
            console.log(err);
            toast.error("เกิดข้อผิดพลาดในการสมัครสมาชิก");
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <Input placeholder="ชื่อผู้ใช้" {...register("username")} />
                {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input placeholder="m@example.com" {...register("email")} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input type="password" {...register("password")} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <Input type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                )}
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">บทบาท</label>
                <Select onValueChange={(value) => setValue("role_id", parseInt(value))}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Admin</SelectItem>
                        <SelectItem value="2">User</SelectItem>
                    </SelectContent>
                </Select>
                {errors.role_id && <p className="text-red-500 text-sm">{errors.role_id.message}</p>}
            </div>

            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                สมัครสมาชิก
            </Button>
        </form>
    )
}
