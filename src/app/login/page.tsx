'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // 1. 引入 useAuth hook

export default function LoginPage() {
  // 2. 從 Context 取得驗證狀態和方法
  const { currentUser, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // 如果使用者已經登入，就自動導向到儀表板
  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // 3. 簡化錯誤處理函式
  const getFriendlyErrorMessage = (err: any): string => {
    // 這段邏輯與 AuthModal 中的相似，未來可以考慮抽成共用函式
    const errorCode = err.code || '';
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '電子郵件或密碼錯誤。';
      case 'auth/email-already-in-use':
        return '此電子郵件已被註冊。';
      case 'auth/weak-password':
        return '密碼強度不足，請設定至少6個字元。';
      default:
        return '發生未知錯誤，請稍後再試。';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 4. 直接呼叫 context 中的方法
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      // 成功後的導向交給 useEffect 處理
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 如果使用者已登入，顯示載入中，等待 useEffect 導向
  if (currentUser) {
    return <div className="flex min-h-screen flex-col items-center justify-center">驗證身分中...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 border rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isRegistering ? '註冊新帳號' : '登入 Oking Inventory'}
        </h1>
        <div>
          <label htmlFor="email" className="sr-only">電子郵件</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="電子郵件"
            className="p-2 border rounded w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">密碼</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密碼"
            className="p-2 border rounded w-full"
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
          {isLoading ? '處理中...' : (isRegistering ? '註冊' : '登入')}
        </button>
        {error && <p className="text-red-500" role="alert">{error}</p>}
        <div className="text-center mt-4">
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-semibold text-blue-500 hover:underline">
            {isRegistering ? '現有帳號登入' : '註冊新帳號'}
          </button>
        </div>
      </form>
    </main>
  );
}
