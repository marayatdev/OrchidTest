import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("Middleware is running! URL:", req.url);
  // อ่าน access_token จาก HTTP-only cookie
  const token = req.cookies.get("accessToken")?.value;

  // ถ้าไม่มี token -> redirect ไป /login
  if (!token) {
    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      if (response.ok) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/", req.url));
    } catch (error) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // มี token -> อนุญาต
  return NextResponse.next();
}

// กำหนด route ที่ต้อง protection
export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/products",
    "/products/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
