"use client"

import DefaultUiComponent from "@/components/Layout/Default";
import { Search } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import api from "@/lib/axios";

interface ProductImage {
    id: number;
    product_id: number;
    image_url: string;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    images: ProductImage[];
}

export default function HomePage() {
    const { user, loading } = useUser();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async (searchTerm = "", pageNum = 1) => {
        try {
            setLoadingProducts(true);
            const res = await api.get("/product/all-product", {
                params: {
                    search: searchTerm,
                    page: pageNum,
                    limit: 12,
                },
            });
            if (res.data.success) {
                setProducts(res.data.data.data);
                setTotalPages(res.data.data.totalPages);
                setPage(res.data.data.page);
            }
        } catch (error) {
            console.error("Fetch products failed:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            fetchProducts(value, 1);
        }, 300),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);
    };

    // Initial fetch
    useEffect(() => {
        fetchProducts("", 1);
    }, []);

    // Skeleton component
    const ProductSkeleton = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-300"></div>
            <div className="p-4 space-y-2">
                <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-5 bg-gray-300 rounded w-1/2"></div>
            </div>
        </div>
    );

    // Pagination controls
    const Pagination = () => (
        <div className="flex justify-center items-center gap-2 mt-6">
            <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={page <= 1 || loadingProducts}
                onClick={() => fetchProducts(search, page - 1)}
            >
                Prev
            </button>
            <span>
                Page {page} of {totalPages}
            </span>
            <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={page >= totalPages || loadingProducts}
                onClick={() => fetchProducts(search, page + 1)}
            >
                Next
            </button>
        </div>
    );

    return (
        <DefaultUiComponent>
            {/* Search Bar */}
            <div className="flex items-center bg-gray-200 rounded-xl p-2 gap-2 w-full max-w-md mx-auto mb-6">
                <Search size={24} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={handleSearchChange}
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loadingProducts
                    ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                    : products.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                            {/* Product Image */}
                            {product.images.length > 0 ? (
                                <img
                                    src={product.images[0].image_url}
                                    alt={product.name}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200"></div>
                            )}
                            {/* Product Info */}
                            <div className="p-4">
                                <h2 className="font-semibold text-lg">{product.name}</h2>
                                <p className="text-gray-500 text-sm my-1">{product.description}</p>
                                <p className="font-bold text-blue-600">${product.price}</p>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Pagination */}
            <Pagination />
        </DefaultUiComponent>
    );
}
