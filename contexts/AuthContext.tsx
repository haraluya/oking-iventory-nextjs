'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { createUserProfile } from '@/lib/firebase/api';
import { UserProfile } from '@/types/firestore';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  register: (email: string, pass: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽 Firebase Auth 狀態變化
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // 當 currentUser 存在時，監聽 Firestore 中的 user profile
    if (currentUser?.uid) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
        setUserProfile(doc.exists() ? (doc.data() as UserProfile) : null);
      });
      return () => unsubscribeProfile();
    }
  }, [currentUser]);

  const register = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    // 註冊成功後，在 Firestore 建立使用者資料
    await createUserProfile(userCredential.user);
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const value = { currentUser, userProfile, loading, register, login, logout };

  // 等待 auth 狀態確認後再渲染子元件，避免畫面閃爍
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};