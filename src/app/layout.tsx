// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers"; // 確保此元件包含 AuthProvider 和 ModalProvider
import Navbar from "@/components/Navbar"; // 引入我們之前建立的 Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "進銷存系統",
  description: "Oking Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="container mx-auto p-4">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
