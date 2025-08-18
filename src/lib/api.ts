// src/lib/api.ts
// 注意：這個檔案現在應該位於 src/lib/ 目錄下

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// 修正了 import 路徑，從 "./firebase" 引入 db
import { db } from "./firebase"; 
import type { Product } from "@/types/firestore";

/**
 * 新增一個商品到 Firestore
 * @param productData - 不包含 id, createdAt, updatedAt 的商品物件
 * @returns 新增文件的 ID 或 null
 */
export const addProduct = async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
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

// createUserProfile 的邏輯已經統一由 AuthContext 管理，故此處已移除
