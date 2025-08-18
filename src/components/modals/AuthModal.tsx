// src/components/modals/AuthModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner"

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useModal();
  const { login, register } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 關鍵偵錯程式碼 ---
  // 這個 console.log 會在每次元件重新渲染時執行。
  // 當我們點擊按鈕時，我們預期會看到它的值從 false 變成 true。
  console.log(`--- AuthModal 重新渲染，isAuthModalOpen 的值是: ${isAuthModalOpen} ---`);


  // 當 Modal 開關或登入/註冊模式切換時，清空表單狀態
  useEffect(() => {
    if (isAuthModalOpen) {
        setError('');
        setEmail('');
        setPassword('');
    }
  }, [isAuthModalOpen, isLoginView]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
        toast.success("登入成功！");
      } else {
        await register(email, password);
        toast.success("註冊成功！歡迎加入！");
      }
      closeAuthModal();
    } catch (err: any) {
      const friendlyError = getFriendlyErrorMessage(err.code);
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return '電子郵件或密碼錯誤。';
      case 'auth/email-already-in-use':
        return '此電子郵件已被註冊。';
      default:
        return '發生未知錯誤，請稍後再試。';
    }
  }
  
  // 為了防止在伺服器端渲染時出錯，我們只在 isAuthModalOpen 為 true 時才渲染 Dialog
  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLoginView ? '登入系統' : '建立新帳號'}</DialogTitle>
          <DialogDescription>
            {isLoginView ? '輸入您的憑證以繼續。' : '立即建立帳號以開始使用。'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">電子郵件</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">密碼</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="col-span-3" />
            </div>
            {error && <p className="col-span-4 text-red-500 text-sm text-center">{error}</p>}
          </div>
          <DialogFooter>
            <div className="w-full flex justify-between items-center">
                <Button type="button" variant="link" onClick={() => setIsLoginView(!isLoginView)}>
                    {isLoginView ? '需要帳號嗎？' : '已經有帳號了？'}
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? '處理中...' : (isLoginView ? '登入' : '註冊')}
                </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
