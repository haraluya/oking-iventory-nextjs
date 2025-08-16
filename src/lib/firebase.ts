// src/lib/firebase.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 您的 Firebase 設定，建議使用環境變數來保護金鑰
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase App
// 避免在伺服器端渲染和客戶端渲染時重複初始化
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

// 導出您的 Firebase 服務實例
export { app, auth, db };

// --- Collection Path Helpers ---
// 將舊專案中的幫助函數也移到這裡，方便共用
const getCollectionPath = (collectionName: string) => `artifacts/${app.options.appId}/public/data/${collectionName}`;
const getDocPath = (collectionName: string, docId: string) => `artifacts/${app.options.appId}/public/data/${collectionName}/${docId}`;

export { getCollectionPath, getDocPath };
