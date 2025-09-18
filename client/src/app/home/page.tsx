"use client"

import DefaultUiComponent from "@/components/Layout/Default"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react";

export default function HomePage() {
    const { user, loading } = useUser()
    const router = useRouter()

    return (
        <DefaultUiComponent>
            <div className="flex items-center bg-gray-200 rounded-xl p-2 gap-2 w-full max-w-md mx-auto">
                <Search size={24} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
            </div>
        </DefaultUiComponent>
    )
}