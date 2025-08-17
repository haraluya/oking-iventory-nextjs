'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getFriendlyErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case AuthErrorCodes.EMAIL_EXISTS:
        return '這個電子郵件已經被註冊了。';
      case AuthErrorCodes.WRONG_PASSWORD:
        return '密碼錯誤，請再試一次。';
      case AuthErrorCodes.USER_DELETED:
        return '找不到此用戶。';
      case AuthErrorCodes.INVALID_EMAIL:
        return '電子郵件格式不正確。';
      case AuthErrorCodes.WEAK_PASSWORD:
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
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // 登入成功後導向到儀表板頁面
      router.push('/dashboard');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 border rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">{isRegistering ? '註冊新帳號' : '登入 Oking Inventory'}</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="電子郵件"
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密碼"
          className="p-2 border rounded"
          required
        />
        <button type="submit" disabled={isLoading} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
          {isLoading ? '處理中...' : (isRegistering ? '註冊' : '登入')}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        <p className="text-center text-sm text-gray-600 mt-4">
          {isRegistering ? '已經有帳號了？' : '還沒有帳號？'}
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="font-semibold text-blue-500 hover:underline ml-1">
            {isRegistering ? '前往登入' : '立即註冊'}
          </button>
        </p>
      </form>
    </main>
  );
}
