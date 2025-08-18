// src/lib/purchaseOrderApi.ts
import { collection, getDocs, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { PurchaseOrder } from "@/types/firestore";

const purchaseOrdersCollectionRef = collection(db, "purchaseOrders");

/**
 * 獲取所有採購訂單列表
 * @returns Promise<(PurchaseOrder & { id: string })[]>
 */
export const getAllPurchaseOrders = async (): Promise<(PurchaseOrder & { id: string })[]> => {
    try {
        const q = query(purchaseOrdersCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PurchaseOrder & { id: string }));
    } catch (error) {
        console.error("讀取採購訂單時發生錯誤: ", error);
        return [];
    }
};

/**
 * 新增或更新一個採購訂單
 * @param order - 要儲存的訂單資料
 */
export const upsertPurchaseOrder = async (order: Omit<PurchaseOrder, 'createdAt' | 'updatedAt' | 'id' | 'createdBy'> & { id?: string }) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("使用者未登入，無法建立訂單");

    try {
        const orderDocRef = order.id ? doc(db, "purchaseOrders", order.id) : doc(purchaseOrdersCollectionRef);
        
        const { id, ...dataToSave } = order;

        await setDoc(orderDocRef, {
            ...dataToSave,
            updatedAt: serverTimestamp(),
            ...( !order.id && { 
                createdAt: serverTimestamp(),
                createdBy: userId,
            }),
        }, { merge: true });

        console.log("採購訂單成功寫入！ Document ID: ", orderDocRef.id);
        return orderDocRef.id;
    } catch (error) {
        console.error("寫入採購訂單時發生錯誤: ", error);
        throw error;
    }
};
