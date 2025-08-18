'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-10">載入中...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">系統首頁</h1>
      {currentUser ? (
        <div>
          <p className="text-lg">您已登入！歡迎回來, {userProfile?.displayName || currentUser.email}!</p>
          {userProfile && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <h2 className="text-xl font-semibold">Firestore 使用者資料</h2>
              <pre className="text-sm bg-gray-100 p-2 rounded">{JSON.stringify(userProfile, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <p className="text-lg">您尚未登入，請點擊右上角的「登入 / 註冊」按鈕。</p>
      )}
    </div>
  );
}

