// src/lib/customerApi.ts
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Customer } from "@/types/firestore";

const customersCollectionRef = collection(db, "customers");

/**
 * 獲取所有客戶列表
 * @returns Promise<(Customer & { id: string })[]>
 */
// --- 修正開始 ---
// 將回傳型別從 Promise<Customer[]> 修改為 Promise<(Customer & { id: string })[]>
export const getAllCustomers = async (): Promise<(Customer & { id: string })[]> => {
// --- 修正結束 ---
    try {
        const querySnapshot = await getDocs(customersCollectionRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Customer & { id: string }));
    } catch (error) {
        console.error("Error fetching customers: ", error);
        return [];
    }
};

/**
 * 新增或更新一個客戶
 * @param customer - 客戶資料
 */
export const upsertCustomer = async (customer: Omit<Customer, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) => {
    try {
        // 如果有 id，表示是更新；否則，建立一個新文件參考
        const customerDocRef = customer.id ? doc(db, "customers", customer.id) : doc(customersCollectionRef);
        
        // 為了寫入資料庫，我們從物件中移除 id
        const { id, ...dataToSave } = customer;

        await setDoc(customerDocRef, {
            ...dataToSave,
            updatedAt: serverTimestamp(),
            // 只有在新增時才寫入 createdAt
            ...( !customer.id && { createdAt: serverTimestamp() }),
        }, { merge: true }); // 使用 merge: true 來安全地更新或建立

        console.log("Customer successfully written!");
    } catch (error) {
        console.error("Error writing customer: ", error);
        throw error;
    }
};

/**
 * 刪除一個客戶
 * @param id - 客戶的文件 ID
 */
export const deleteCustomer = async (id: string): Promise<void> => {
    try {
        const customerDocRef = doc(db, "customers", id);
        await deleteDoc(customerDocRef);
        console.log("Customer successfully deleted!");
    } catch (error) {
        console.error("Error deleting customer: ", error);
        throw error;
    }
};
