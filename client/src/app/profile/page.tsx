"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import DefaultUiComponent from "@/components/Layout/Default"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useUser } from "@/context/UserContext"
import api from "@/lib/axios"
import { toast } from "sonner";
import { useRouter } from "next/navigation"

const profileSchema = z
    .object({
        id: z.number(),
        username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
        email: z.string().email("อีเมลไม่ถูกต้อง"),
        old_password: z.string().optional(),
        password: z.string().optional(),
        confirmPassword: z.string().optional(),
        role_id: z.number(),
    })
    .superRefine((data, ctx) => {
        // ถ้า password ถูกกรอก
        if (data.password) {
            // ต้องมี old_password
            if (!data.old_password) {
                ctx.addIssue({
                    code: "custom",
                    path: ["old_password"],
                    message: "กรุณากรอกรหัสผ่านเก่าเพื่อเปลี่ยนรหัสผ่าน",
                })
            }
            // password ต้อง >= 6 ตัวอักษร
            if (data.password.length < 6) {
                ctx.addIssue({
                    code: "custom",
                    path: ["password"],
                    message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                })
            }
            // password ต้องตรงกับ confirmPassword
            if (data.password !== data.confirmPassword) {
                ctx.addIssue({
                    code: "custom",
                    path: ["confirmPassword"],
                    message: "รหัสผ่านไม่ตรงกัน",
                })
            }
        }
    })

type ProfileForm = z.infer<typeof profileSchema>


export default function ProfilePage() {
    const { user, setUser } = useUser()
    const router = useRouter()
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    })

    // เซ็ตค่าเริ่มต้นจาก user context
    useEffect(() => {
        if (user) {
            setValue("id", Number(user.id))
            setValue("username", user.username)
            setValue("email", user.email)
            setValue("role_id", user.role_id)
        }
    }, [user, setValue])

    const onSubmit = async (data: ProfileForm) => {
        try {
            const payload = Object.fromEntries(
                Object.entries(data)
                    .filter(([key, value]) => value !== undefined && value !== "")
            )

            delete payload.confirmPassword

            const response = await api.put("/users", payload)

            if (response.data.status === 200) {
                setUser(prev => ({
                    ...prev!,
                    ...payload,
                }))
                router.push('/home')
                toast.success("อัพเดตโปรไฟล์สำเร็จ")
            }
        } catch (error) {
            toast.error("อัพเดตโปรไฟล์ไม่สำเร็จ")
            console.error("Error updating profile:", error)
        }
    }


    return (
        <DefaultUiComponent>
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
                    <label className="text-sm font-medium text-gray-700">รหัสผ่านเก่า</label>
                    <Input type="password" {...register("old_password")} />
                    {errors.old_password && (
                        <p className="text-red-500 text-sm">{errors.old_password.message}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                    <Input type="password" {...register("password")} />
                    {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน</label>
                    <Input type="password" {...register("confirmPassword")} />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">บทบาท</label>
                    <Select
                        value={user?.role_id?.toString()} // ตั้งค่าเริ่มต้นจาก user
                        onValueChange={(value) => setValue("role_id", parseInt(value))}
                    >
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
                    อัปเดตโปรไฟล์
                </Button>
            </form>
        </DefaultUiComponent>
    )
}
