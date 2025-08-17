// src/context/AuthContext.tsx
'use client';

import { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    ReactNode,
    Dispatch,
    SetStateAction
} from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // 從新的 firebase.ts 匯入

// 定義 Context 中值的型別
interface AuthContextType {
  user: User | null;
  // 您的專案中有手動切換角色的功能，所以我們保留 setRole
  role: 'admin' | 'warehouse' | null;
  setRole: Dispatch<SetStateAction<'admin' | 'warehouse' | null>>;
  loading: boolean;
}

// 建立 Context，並提供一個預設值
const AuthContext = createContext<AuthContextType | null>(null);

// 建立一個自訂 Hook，方便在其他元件中使用 AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 建立 Provider 元件
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'warehouse' | null>('admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽 Firebase 身份驗證狀態的變化
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 如果有使用者，設定 user 狀態
        setUser(currentUser);
        // 在這裡可以加入從 Firestore 獲取真實角色的邏輯
        // (目前沿用您舊專案的邏輯，允許手動切換)
      } else {
        // 如果沒有使用者，嘗試匿名登入
        try {
          // 只有在沒有現有使用者的情況下才進行匿名登入，避免重複登入
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Firebase 匿名登入失敗:", error);
        }
      }
      setLoading(false);
    });

    // 元件卸載時，取消監聽
    return () => unsubscribe();
  }, []);

  const value = { user, role, setRole, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
