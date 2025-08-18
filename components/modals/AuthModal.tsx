'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';

export default function AuthModal() {
  const { modal, closeModal } = useModal();
  const { login, register } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (modal !== 'auth') {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      closeModal();
    } catch (err: any) {
      // 根據 Firebase 的錯誤碼顯示更友善的訊息
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('電子郵件或密碼錯誤。');
          break;
        case 'auth/email-already-in-use':
          setError('此電子郵件已被註冊。');
          break;
        default:
          setError('發生未知錯誤，請稍後再試。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={closeModal}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-center">{isLoginView ? '登入系統' : '建立新帳號'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">電子郵件</label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">密碼</label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300" type="submit" disabled={loading}>
              {loading ? '處理中...' : (isLoginView ? '登入' : '註冊')}
            </button>
            <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
              {isLoginView ? '需要帳號嗎？' : '已經有帳號了？'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}