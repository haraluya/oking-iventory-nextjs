import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./config";
import type { Product, UserProfile } from "@/types/firestore";
import type { User } from "firebase/auth";

/**
 * 新增一個商品到 Firestore
 * @param productData - 不包含 id, createdAt, updatedAt 的商品物件
 * @returns 新增文件的 ID 或 null
 */
export const addProduct = async (productData: Omit<Product, "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: serverTimestamp(), // 使用伺服器時間戳
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error("新增商品時發生錯誤: ", e);
    return null;
  }
};

/**
 * 在 Firestore 中為新用戶建立個人資料文件
 * @param user - 從 Firebase Authentication 取得的 User 物件
 */
export const createUserProfile = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName } = user;
    await setDoc(userRef, {
      email,
      displayName: displayName || email?.split('@')[0] || 'New User',
      role: 'sales', // 新用戶預設角色
      isActive: true,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    } as Omit<UserProfile, 'photoURL'>);
  }
};