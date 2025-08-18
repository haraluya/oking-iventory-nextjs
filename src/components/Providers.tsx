// src/components/Providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ModalProvider } from '@/context/ModalContext';
import { ReactNode } from 'react';
import AuthModal from './modals/AuthModal';
import { Toaster } from "@/components/ui/sonner"


export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        {children}
        <AuthModal />
        {/* 加入 Toaster，並設定 position */}
        <Toaster position="top-right" richColors />
      </ModalProvider>
    </AuthProvider>
  );
}