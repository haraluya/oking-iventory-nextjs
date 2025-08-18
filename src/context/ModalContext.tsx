// src/context/ModalContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// 1. 簡化 Context 型別定義
interface ModalContextType {
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  showConfirmation: (message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

// 2. 建立新的 Confirmation State 型別
interface ConfirmationState {
  isOpen: boolean;
  message: string;
  resolve: (value: boolean) => void;
}

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    
    // 3. 管理確認對話框的 State
    const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

    const openAuthModal = () => setAuthModalOpen(true);
    const closeAuthModal = () => setAuthModalOpen(false);

    // 4. showConfirmation 回傳一個 Promise，並將 resolve 函式存起來
    const showConfirmation = useCallback((message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmation({
                isOpen: true,
                message,
                resolve,
            });
        });
    }, []);
    
    // 5. 處理使用者的選擇 (確定/取消)
    const handleConfirmation = (result: boolean) => {
        if (confirmation) {
            confirmation.resolve(result);
            setConfirmation(null);
        }
    };

    const value = {
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        showConfirmation,
    };

    return (
        <ModalContext.Provider value={value}>
            {children}

            {/* 6. 全域的 Shadcn/UI 確認對話框 */}
            {confirmation && (
                 <AlertDialog open={confirmation.isOpen} onOpenChange={() => handleConfirmation(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>請確認</AlertDialogTitle>
                            <AlertDialogDescription>
                                {confirmation.message}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => handleConfirmation(false)}>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleConfirmation(true)}>確定</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};