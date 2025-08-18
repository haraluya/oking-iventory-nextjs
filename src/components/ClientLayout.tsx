// src/components/ClientLayout.tsx
'use client';

import { ReactNode } from 'react';
import Providers from './Providers';
import Header from './Navbar'; // 雖然檔名叫 Navbar, 但內容已是 Header
import SidebarNav from './SidebarNav';
import { useAuth } from '@/context/AuthContext';
import { Package2 } from 'lucide-react'; // 修正：從 lucide-react 匯入 Package2 圖示

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthContent>{children}</AuthContent>
    </Providers>
  );
}

// 我們將需要驗證的內容抽出來，這樣才能使用 useAuth Hook
function AuthContent({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();

  // 如果使用者已登入，顯示儀表板佈局
  if (currentUser) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <a href="/" className="flex items-center gap-2 font-semibold">
                <Package2 className="h-6 w-6" />
                <span>Oking 進銷存</span>
              </a>
            </div>
            <div className="flex-1">
              <SidebarNav />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // 如果使用者未登入，則顯示一個包含標頭和主要內容的簡單佈局
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
