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

