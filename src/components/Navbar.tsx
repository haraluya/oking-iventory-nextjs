// src/components/Navbar.tsx
'use client';

import { CircleUser, Menu, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import SidebarNav from './SidebarNav';

export default function Header() {
  const { currentUser, userProfile, logout } = useAuth();
  // 從 useModal 取得 openAuthModal
  const { showConfirmation, openAuthModal } = useModal();

  const handleLogout = async () => {
    const confirmed = await showConfirmation('您確定要登出嗎？');
    if (confirmed) {
      await logout();
    }
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Oking Inc.</span>
        </a>
        {/* 只有在登入後才顯示儀表板連結 */}
        {currentUser && (
          <a
            href="/dashboard"
            className="text-foreground transition-colors hover:text-foreground"
          >
            儀表板
          </a>
        )}
      </nav>
      
      {/* 只有在登入後才顯示手機版的選單按鈕 */}
      {currentUser && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SidebarNav />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {/* 根據登入狀態顯示不同內容 */}
        {currentUser ? (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {userProfile?.displayName || currentUser.email}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>我的帳號</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>設定</DropdownMenuItem>
                <DropdownMenuItem>支援</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>登出</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          // 未登入時，顯示登入按鈕
          <Button onClick={openAuthModal}>登入 / 註冊</Button>
        )}
      </div>
    </header>
  );
}
