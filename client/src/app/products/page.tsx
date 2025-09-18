"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"

export default function ProductsPage() {
    const { user, loading } = useUser()
    const router = useRouter()

    console.log("user in ProductsPage:", user);

    useEffect(() => {
        if (!loading) {
            if (!user || user.role_id !== "2") {
                router.replace("/home")
            }
        }
    }, [user, loading, router])

    if (loading || !user || user.role_id !== "2") {
        return <p>Loading...</p>
    }

    return (
        <div>
            <h1>Products Page (เฉพาะ role_id === 1)</h1>
        </div>
    )
}
