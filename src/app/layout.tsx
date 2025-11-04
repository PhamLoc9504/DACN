import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { getSessionFromCookies } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kho Hàng - Quản lý kho chuyên nghiệp",
  description: "Hệ thống quản lý kho hàng hiện đại tích hợp Supabase.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-[#4a372e]`}>
        <AppShell session={session}>{children}</AppShell>
      </body>
    </html>
  );
}
