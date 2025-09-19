"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import DefaultUiComponent from "@/components/Layout/Default";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext";


interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    images: string[]; // presigned URL
}

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().min(0, "Price must be >= 0"),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductEditCreatePage() {
    const router = useRouter()
    const params = useParams();
    const productId = Number(params.id);
    const { user, loading } = useUser()

    useEffect(() => {
        if (!loading) {
            if (!user || user?.role_id !== 1) {
                router.replace("/home")
            }
        }
    }, [user, loading, router])

    const [oldImages, setOldImages] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [loadingg, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductForm>({
        resolver: zodResolver(productSchema),
    });



    // โหลดข้อมูล product ถ้า id !== 0
    useEffect(() => {
        if (productId === 0) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/product/${productId}`);
                const product: Product = res.data.data;
                setValue("name", product.name);
                setValue("description", product.description);
                setValue("price", Number(product.price));
                setOldImages(product.images || []);
            } catch (err: any) {
                console.error(err);
                alert(err.response?.data?.message || "Failed to fetch product");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId, setValue]);

    const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const fileArray = Array.from(files);

        if (oldImages.length + newFiles.length + fileArray.length > 3) {
            alert("You can upload maximum 3 images");
            return;
        }

        setNewFiles(prev => [...prev, ...fileArray]);
    };

    const removeOldImage = (index: number) => {
        setOldImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewFile = (index: number) => {
        console.log(index);

        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: ProductForm) => {
        if (oldImages.length + newFiles.length === 0) {
            alert("Please select at least 1 image");
            return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("price", data.price.toString());
        newFiles.forEach(file => formData.append("images", file));

        // แปลง oldImages (presigned URL) → ชื่อไฟล์จริง
        const oldFileNames = oldImages.map(url => {
            const fullFileName = url.split('/').pop()!;         // "1758294013769_ChatGPT Image 13 ...png?X-Amz-Algorithm=AWS4..."
            return decodeURIComponent(fullFileName.split('?')[0]); // ตัด query string ออก
        });
        formData.append("oldImages", JSON.stringify(oldFileNames));

        try {
            setLoading(true);
            if (productId === 0) {
                const res = await api.post("/product", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                router.replace("/products")
                alert("Product created successfully! ID: " + res.data.productId);
            } else {
                const res = await api.put(`/product/${productId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                router.replace("/products")
                alert("Product updated successfully!");
            }
            reset();
            setNewFiles([]);
            if (productId === 0) setOldImages([]);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };


    if (loadingg) {
        return <DefaultUiComponent><p>Loading...</p></DefaultUiComponent>;
    }

    return (
        <DefaultUiComponent>
            <h1 className="text-2xl font-bold mb-4">
                {productId === 0 ? "Create Product" : "Edit Product"}
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Label>Name</Label>
                    <Input type="text" {...register("name")} />
                    {errors.name && <p className="text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                    <Label>Description</Label>
                    <Textarea {...register("description")} />
                    {errors.description && <p className="text-red-500">{errors.description.message}</p>}
                </div>

                <div>
                    <Label>Price</Label>
                    <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
                    {errors.price && <p className="text-red-500">{errors.price.message}</p>}
                </div>

                <div>
                    <Label>Images (max 3)</Label>
                    <div className="relative">
                        <Input
                            // value={
                            //     newFiles.length + oldImages.length === 0
                            //         ? "Select images..."
                            //         : [
                            //             ...oldImages.map((url) => url.split("/").pop()),
                            //             ...newFiles.map((f) => f.name),
                            //         ].join(", ")
                            // }
                            readOnly
                            className="cursor-pointer"
                        />
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleNewFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* Preview รูปเก่า */}
                    {oldImages.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {oldImages.map((url, index) => (
                                <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                                    <img src={url} alt={`Old ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeOldImage(index)}
                                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preview รูปใหม่ */}
                    {newFiles.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {newFiles.map((file, index) => (
                                <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewFile(index)}
                                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button type="submit" disabled={loadingg}>
                    {loadingg ? (productId === 0 ? "Creating..." : "Updating...") : (productId === 0 ? "Create Product" : "Update Product")}
                </Button>
            </form>
        </DefaultUiComponent>
    );
}
