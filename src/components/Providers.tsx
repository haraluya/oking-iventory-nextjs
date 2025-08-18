'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ModalProvider } from '@/context/ModalContext';
import { ReactNode } from 'react';
import AuthModal from './modals/AuthModal';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        {children}
        <AuthModal />
      </ModalProvider>
    </AuthProvider>
  );
}