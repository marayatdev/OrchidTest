"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
    username: z.string(),
    password: z.string().min(6, "Password ต้องมีอย่างน้อย 6 ตัวอักษร"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
    const router = useRouter()
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await api.post('/auth/login', data)
            const user = response.data.data
            console.log("user:", user);
            if (user.role_id === 1) {
                router.push('/products')
            } else if (user.role_id === 2) {
                router.push('/home')
            } else {
                console.warn("Role ไม่รู้จัก")
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input placeholder="m@example.com" {...register("username")} value={"jengs"} />
                {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input type="password" {...register("password")} value={"123456789"} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                เข้าสู่ระบบ
            </Button>
        </form>
    )
}
