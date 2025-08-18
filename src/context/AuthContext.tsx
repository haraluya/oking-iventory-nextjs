// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // 確保您的 firebase.ts 在此路徑
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 1. 定義使用者個人資料的型別
interface UserProfile {
  displayName: string;
  email: string;
  // 您未來可以加入更多欄位，例如：role, avatarUrl 等
}

// 2. 定義 Context 需要提供的值的型別
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 3. 建立 AuthProvider 元件
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 監聽 Firebase 驗證狀態的變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // 如果使用者登入，從 Firestore 取得他們的個人資料
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // 元件卸載時取消監聽
    return () => unsubscribe();
  }, []);

  // 註冊函式
  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // 在 Firestore 中為新使用者建立一個文件
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      displayName: email.split('@')[0], // 預設使用 email 前綴當作顯示名稱
      email: user.email,
    });
  };

  // 登入函式
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // 登出函式
  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
  };

  // 只有在 loading 結束後才渲染子元件，避免閃爍
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 4. 建立一個方便使用的 custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
