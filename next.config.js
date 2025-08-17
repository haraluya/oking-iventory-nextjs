// next.config.js
// 請在專案根目錄建立這個新檔案

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 這是 Next.js 14 的預設值，但我們明確地寫出來，
  // 讓建置工具（如 Firebase）可以清楚地知道這是一個獨立的伺服器應用，
  // 而不是一個靜態導出 (static export) 的網站。
  output: 'standalone',
};

module.exports = nextConfig;
