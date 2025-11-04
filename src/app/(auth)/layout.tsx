import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Đăng nhập - Kho Hàng",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Nested layout: DO NOT render <html>/<body> here to avoid hydration mismatch
  return <div className="min-h-screen bg-gradient-to-b from-[#fffdfb] to-[#fff8f3]">{children}</div>;
}


