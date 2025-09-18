"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import DefaultUiComponent from "@/components/Layout/Default"

export default function ProductsPage() {
    const { user, loading } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user || user?.role_id !== 1) {
                router.replace("/home")
            }
        }
    }, [user, loading, router])


    return (
        <DefaultUiComponent>
            <h1>Products Page (เฉพาะ role_id === 1)</h1>
        </DefaultUiComponent>
    )
}
