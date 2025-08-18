// src/lib/supplierApi.ts
import { collection, getDocs, doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Supplier } from "@/types/firestore";

// 建立一個對 'suppliers' 集合的參考
const suppliersCollectionRef = collection(db, "suppliers");

/**
 * 獲取所有供應商列表
 * @returns Promise<(Supplier & { id: string })[]> - 包含文件ID的供應商陣列
 */
export const getAllSuppliers = async (): Promise<(Supplier & { id: string })[]> => {
    try {
        const querySnapshot = await getDocs(suppliersCollectionRef);
        // 遍歷查詢結果，將每個文件資料與其ID組合成一個物件
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Supplier & { id: string }));
    } catch (error) {
        console.error("讀取供應商資料時發生錯誤: ", error);
        return [];
    }
};

/**
 * 新增或更新一個供應商
 * @param supplier - 要儲存的供應商資料，可以包含或不包含 id
 */
export const upsertSupplier = async (supplier: Omit<Supplier, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) => {
    try {
        // 如果 supplier 物件有 id，表示是更新現有文件；否則，建立一個新的文件參考
        const supplierDocRef = supplier.id ? doc(db, "suppliers", supplier.id) : doc(suppliersCollectionRef);
        
        // 為了乾淨地寫入資料庫，我們先從物件中移除 id 屬性
        const { id, ...dataToSave } = supplier;

        // 使用 setDoc 搭配 merge: true 來安全地建立或更新文件
        // 這樣做可以避免覆蓋掉不想更動的欄位
        await setDoc(supplierDocRef, {
            ...dataToSave,
            updatedAt: serverTimestamp(),
            // 只有在新增文件時 (supplier.id 不存在) 才寫入 createdAt
            ...( !supplier.id && { createdAt: serverTimestamp() }),
        }, { merge: true });

        console.log("供應商資料成功寫入！");
    } catch (error) {
        console.error("寫入供應商資料時發生錯誤: ", error);
        // 將錯誤向上拋出，讓前端可以捕捉並處理
        throw error;
    }
};

/**
 * 刪除一個供應商
 * @param id - 要刪除的供應商文件 ID
 */
export const deleteSupplier = async (id: string): Promise<void> => {
    try {
        const supplierDocRef = doc(db, "suppliers", id);
        await deleteDoc(supplierDocRef);
        console.log("供應商資料成功刪除！");
    } catch (error) {
        console.error("刪除供應商資料時發生錯誤: ", error);
        throw error;
    }
};
