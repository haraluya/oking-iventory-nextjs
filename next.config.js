const nextConfig = {
  // 明確指定輸出模式為 'standalone'。
  // 這會產生一個標準的、包含伺服器依賴的輸出目錄，
  // 讓 Firebase 的框架感知部署功能可以 100% 準確地識別它。
  output: 'standalone',
};

module.exports = nextConfig;