// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "進銷存系統",
  description: "Oking Inventory System",
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
          {/* 這是從您舊專案 App.js 複製過來的全域樣式 */}
          <style>{`
              input[type=number]::-webkit-inner-spin-button,
              input[type=number]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
              input[type=number] {
                -moz-appearance: textfield;
              }
          `}</style>
          {/* 
            這裡將是您應用程式的主要結構。
            之後我們會把 Sidebar 和 Header 放在這裡。
            {children} 代表的是每個頁面 (page.tsx) 的內容。
          */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
