"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import DefaultUiComponent from "@/components/Layout/Default"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import api from "@/lib/axios"
import { toast } from "sonner";

interface Product {
    id: number
    name: string
    description: string
    price: number
    images: { id: number; image_url: string }[]
}

export default function ProductsPage() {
    const { user, loading } = useUser()
    const router = useRouter()

    const [products, setProducts] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 5

    const fetchProducts = async () => {
        try {
            const res = await api.get<{
                success: boolean
                status: number
                message: string
                data: {
                    data: Product[]
                    total: number
                    totalPages: number
                    page: number
                    limit: number
                }
            }>(`/product?page=${page}&limit=${limit}`)

            setProducts(res.data.data.data)
            setTotal(res.data.data.total)
            setTotalPages(res.data.data.totalPages)
        } catch (err) {
            console.error("โหลดสินค้าไม่สำเร็จ:", err)
        }
    }

    useEffect(() => {
        if (!loading) {
            if (!user || user?.role_id !== 1) {
                router.replace("/home")
            }
        }
    }, [user, loading, router])

    useEffect(() => {
        fetchProducts()
    }, [page])

    // ฟังก์ชันลบสินค้า
    const handleDelete = async (id: number) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าจะลบสินค้านี้?")) return
        try {
            await api.delete(`/product/${id}`)
            alert("ลบสินค้าสำเร็จ")
            toast.success("ลบสินค้าสำเร็จ");
            fetchProducts() // รีเฟรชรายการสินค้า
        } catch (err) {
            console.error("ลบสินค้าไม่สำเร็จ:", err)
            toast.error("ลบสินค้าไม่สำเร็จ");
        }
    }

    return (
        <DefaultUiComponent>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">
                    Products ({total} รายการ)
                </h1>
                <Button onClick={() => router.push("/products/0")}>
                    สร้างสินค้า
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>ราคา</TableHead>
                        <TableHead>จำนวนรูป</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>{product.id}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.price} บาท</TableCell>
                            <TableCell>{product.images.length}</TableCell>
                            <TableCell className="text-right flex gap-2 justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/products/${product.id}`)}
                                >
                                    แก้ไข
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    ลบ
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage((p) => Math.max(p - 1, 1))
                                }}
                            />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    href="#"
                                    isActive={page === i + 1}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setPage(i + 1)
                                    }}
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage((p) => Math.min(p + 1, totalPages))
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </DefaultUiComponent>
    )
}
