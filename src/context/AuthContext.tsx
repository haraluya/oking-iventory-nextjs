// src/context/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // 從新的 firebase.ts 匯入

// 定義使用者個人資料的型別
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Timestamp;
  // 您可以根據需求增加更多欄位，例如 role
  // role: 'admin' | 'warehouse';
}

// 定義 Context 中值的型別
export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// 建立 Context，並提供一個預設值
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// #建立一個自訂 Hook，方便在其他元件中使用 AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 建立 Provider 元件
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽 Firebase 身份驗證狀態的變化
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setCurrentUser(currentUser);
      if (currentUser) {
        // 如果有使用者，從 Firestore 獲取使用者資料
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // 如果 Firestore 中沒有資料，可以考慮建立一個預設的
          setUserProfile(null);
        }
      } else {
        // 如果沒有使用者，清空使用者資料
        setUserProfile(null);
      }
      setLoading(false);
    });

    // 元件卸載時，取消監聽
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // 在 Firestore 中為新使用者建立一個文件
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.email?.split('@')[0] || 'New User', // 預設顯示名稱
      createdAt: serverTimestamp(),
      // role: 'warehouse', // 預設角色
    });
  };

  const logout = () => signOut(auth);

  const value = { currentUser, userProfile, loading, login, register, logout };

  // 在載入完成前不渲染子元件，避免閃爍
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
