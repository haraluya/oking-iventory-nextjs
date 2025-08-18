'use client';

import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const { openModal } = useModal();

  return (
    <nav className="bg-gray-800 p-4 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Oking 進銷存</h1>
        <div>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span>歡迎, {userProfile?.displayName || currentUser.email}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                登出
              </button>
            </div>
          ) : (
            <button onClick={() => openModal('auth')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              登入 / 註冊
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}