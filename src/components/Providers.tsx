'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ModalProvider } from '@/contexts/ModalContext';
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