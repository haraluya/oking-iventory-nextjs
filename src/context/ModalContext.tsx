// src/context/ModalContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// --- 1. 新增 ModalType ---
// 定義可以被開啟的具名 Modal 的類型
type ModalType = 'auth' | null;

// --- 2. 更新 ModalContextType ---
// 在型別定義中加入管理 AuthModal 所需的屬性
interface ModalContextType {
  modal: ModalType;
  openModal: (type: 'auth') => void;
  closeModal: () => void;
  showMessage: (message: string, type?: 'success' | 'error') => void;
  showConfirmation: (message: string) => Promise<boolean>;
}

// --- 以下為既有型別，保持不變 ---
interface Message {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ConfirmationModal {
  type: 'confirmation';
  message: string;
  onResolve: (result: boolean) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

let messageIdCounter = 0;

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    // --- 3. 新增 State ---
    // 這個 state 專門用來控制 AuthModal 的開關
    const [modal, setModal] = useState<ModalType>(null);
    
    // (既有 state，稍作改名以增加可讀性)
    const [confirmation, setConfirmation] = useState<ConfirmationModal | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    // --- 4. 新增函式 ---
    // 開啟 AuthModal 的函式
    const openModal = (type: 'auth') => setModal(type);
    // 關閉 AuthModal 的函式
    const closeModal = () => setModal(null);

    // (既有函式，保持不變)
    const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
        const id = messageIdCounter++;
        setMessages(prev => [...prev, { id, message, type }]);
        setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
    };

    const showConfirmation = (message: string): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmation({ 
                type: 'confirmation', 
                message, 
                onResolve: (result) => { 
                    setConfirmation(null); 
                    resolve(result); 
                } 
            });
        });
    };

    // --- 5. 更新 Provider 的 value ---
    // 將所有 state 和函式都傳遞下去
    const value = {
        modal,
        openModal,
        closeModal,
        showMessage,
        showConfirmation
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
            {/* 彈出訊息的渲染位置 (保持不變) */}
            <div className="fixed top-5 right-5 z-50 space-y-2">
                {messages.map(({ id, message, type }) => (
                    <div key={id} className={`px-4 py-2 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {message}
                    </div>
                ))}
            </div>
            {/* 確認對話框的渲染位置 (保持不變) */}
            {confirmation?.type === 'confirmation' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm text-center">
                        <p className="text-lg mb-6">{confirmation.message}</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => confirmation.onResolve(false)} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300">取消</button>
                            <button onClick={() => confirmation.onResolve(true)} className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600">確定</button>
                        </div>
                    </div>
                </div>
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
