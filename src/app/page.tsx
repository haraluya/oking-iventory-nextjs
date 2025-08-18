// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 當 AuthContext 載入完成後，且 currentUser 存在時，跳轉到儀表板
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  // 如果正在載入或已登入，顯示載入中或空白，避免閃爍
  if (loading || currentUser) {
    return <div>Loading...</div>; // 或者一個好看的載入動畫
  }

  // 只在使用者確定未登入時，顯示歡迎訊息
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">歡迎來到 Oking 進銷存系統</h1>
      <p className="text-lg text-muted-foreground">請點擊右上角的按鈕登入以繼續。</p>
    </div>
  );
}
