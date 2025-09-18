"use client"

import { useState } from "react"
import RegisterForm from "@/components/auth/RegisterForm"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import LoginForm from "@/components/auth/LoginPage"

export default function Home() {
  const [isRegister, setIsRegister] = useState(false)

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-100">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">
            Orchid Jobs Test
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isRegister ? <RegisterForm onRegisterSuccess={() => setIsRegister(false)} /> : <LoginForm />}
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <p className="text-sm text-center text-gray-600">
            {isRegister ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชีใช่ไหม?"}{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline font-medium"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
