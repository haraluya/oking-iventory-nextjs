'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 使用者已登入，導向到儀表板
        router.push('/dashboard');
      } else {
        // 使用者未登入，停止載入並顯示頁面
        setIsLoading(false);
      }
    });

    // 在元件卸載時取消監聽
    return () => unsubscribe();
  }, [router]);

  // 正在檢查登入狀態時，顯示載入畫面
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-lg">載入中...</p>
      </main>
    );
  }

  // 如果未載入且無使用者，顯示歡迎頁面
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Oking Inventory</h1>
        <p className="mt-4 text-lg text-gray-600">您的庫存管理系統</p>
        <div className="mt-8">
          <Link href="/login" className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600">
            前往登入
          </Link>
        </div>
      </div>
    </main>
  );
}