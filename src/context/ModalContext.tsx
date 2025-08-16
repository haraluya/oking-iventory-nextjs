// src/context/ModalContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// 定義 Message 和 Modal 的型別
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

// 定義 Context 中值的型別
interface ModalContextType {
  showMessage: (message: string, type?: 'success' | 'error') => void;
  showConfirmation: (message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [modal, setModal] = useState<ConfirmationModal | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setMessages(prev => [...prev, { id, message, type }]);
        setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
    };

    const showConfirmation = (message: string): Promise<boolean> => {
        return new Promise(resolve => {
            setModal({ 
                type: 'confirmation', 
                message, 
                onResolve: (result) => { 
                    setModal(null); 
                    resolve(result); 
                } 
            });
        });
    };

    return (
        <ModalContext.Provider value={{ showMessage, showConfirmation }}>
            {children}
            {/* 彈出訊息的渲染位置 */}
            <div className="fixed top-5 right-5 z-50 space-y-2">
                {messages.map(({ id, message, type }) => (
                    <div key={id} className={`px-4 py-2 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {message}
                    </div>
                ))}
            </div>
            {/* 確認對話框的渲染位置 */}
            {modal?.type === 'confirmation' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm text-center">
                        <p className="text-lg mb-6">{modal.message}</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => modal.onResolve(false)} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300">取消</button>
                            <button onClick={() => modal.onResolve(true)} className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600">確定</button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

// 建立一個自訂 Hook，方便在其他元件中使用 ModalContext
export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
