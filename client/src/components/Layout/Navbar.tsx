import { Menu, X } from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/axios";
import { useRouter } from "next/navigation"

const Navbar = () => {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false);

    const Logout = async () => {
        try {
            const response = await api.post("/auth/logout")

            if (response.data.status === 200) {
                router.push("/")
                localStorage.removeItem('user');
            }
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="p-8 bg-blue-500 rounded-b-xl relative">
            <div className="max-w-7xl w-full mx-auto flex items-center justify-between md:grid md:grid-cols-3">
                {/* ซ้าย - Logo */}
                <div className="flex justify-start">
                    <h1 className="text-2xl font-bold text-white">Logo</h1>
                </div>

                {/* กลาง - Menu (Desktop) */}
                <div className="hidden md:flex justify-center gap-6">
                    <h1 className="text-2xl font-bold text-white cursor-pointer">Home</h1>
                    <h1 className="text-2xl font-bold text-white cursor-pointer">Profile</h1>
                    <h1 className="text-2xl font-bold text-white cursor-pointer">Product</h1>
                </div>

                {/* ขวา - Username + Hamburger */}
                <div className="flex items-center justify-end gap-4 relative">
                    {/* Desktop Dropdown */}
                    <div className="hidden md:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <h1 className="text-2xl font-bold text-white cursor-pointer">
                                    username
                                </h1>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40 bg-white rounded-lg shadow-lg">
                                <DropdownMenuItem className="text-red-500" onClick={() => Logout()}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Hamburger (Mobile) */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* เมนู Mobile */}
            {isOpen && (
                <div className="flex flex-col items-center gap-4 mt-4 md:hidden">
                    <h1 className="text-xl font-bold text-white cursor-pointer">Home</h1>
                    <h1 className="text-xl font-bold text-white cursor-pointer">Profile</h1>
                    <h1 className="text-xl font-bold text-white cursor-pointer">Product</h1>
                    {/* Username Menu แยกเป็น list ธรรมดา */}
                    <h1 className="text-xl font-bold text-white cursor-pointer text-red-500">Logout</h1>
                </div>
            )}
        </div>
    );
};

export default Navbar;
