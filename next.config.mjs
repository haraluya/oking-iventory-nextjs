import path from 'path';
import { fileURLToPath } from 'url';

// 因為這是 ES Module，__dirname 變數不存在，我們需要手動建立它。
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 明確指定輸出模式為 'standalone'。
  // 這會產生一個標準的、包含伺服器依賴的輸出目錄，
  // 讓 Firebase 的框架感知部署功能可以 100% 準確地識別它。
  output: 'standalone',

  // 解決在 GitHub Actions 中找不到 '@/' 路徑別名的問題
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
};

export default nextConfig;