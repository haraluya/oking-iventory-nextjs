// src/lib/productApi.ts
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, writeBatch, query, orderBy, collectionGroup } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Product, InventoryHistory } from "@/types/firestore";

const productsCollectionRef = collection(db, "products");
// 新增：建立一個對全域歷史紀錄集合的參考
const historyCollectionRef = collection(db, "inventory_history");

// getAllProducts, getProductBySku, upsertProduct 保持不變...
export const getAllProducts = async (): Promise<(Product & { id: string })[]> => {
    try {
        const querySnapshot = await getDocs(productsCollectionRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Product & { id: string }));
    } catch (error) {
        console.error("Error fetching products: ", error);
        return [];
    }
};

export const upsertProduct = async (product: Omit<Product, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) => {
    try {
        const productDocRef = doc(db, "products", product.id || product.sku);
        const { id, ...dataToSave } = product;

        await setDoc(productDocRef, {
            ...dataToSave,
            updatedAt: serverTimestamp(),
            ...(!id && { createdAt: serverTimestamp() }),
        }, { merge: true });

        console.log("Product successfully written!");
    } catch (error) {
        console.error("Error writing product: ", error);
        throw error;
    }
};


/**
 * (已修改) 調整商品庫存並在全域集合中新增歷史紀錄
 * @param productId - 商品的 Firestore 文件 ID
 * @param newStock - 調整後的新庫存數量
 * @param note - 備註
 */
export const adjustStock = async (productId: string, newStock: number, note: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("使用者未登入，無法執行操作");

    const productDocRef = doc(db, "products", productId);

    try {
        const productSnap = await getDoc(productDocRef);
        if (!productSnap.exists()) throw new Error("找不到該商品");

        const productData = productSnap.data() as Product;
        const oldStock = productData.currentStock;
        const change = newStock - oldStock;

        const batch = writeBatch(db);

        batch.update(productDocRef, {
            currentStock: newStock,
            updatedAt: serverTimestamp()
        });

        const historyDoc: Omit<InventoryHistory, 'id' | 'timestamp'> = {
            productId: productId,
            productSku: productData.sku,
            productName: productData.name,
            type: "adjustment",
            change: change,
            stockAfter: newStock,
            note: note || "庫存盤點調整",
            userId: userId,
        };
        const newHistoryRef = doc(historyCollectionRef);
        batch.set(newHistoryRef, { ...historyDoc, timestamp: serverTimestamp() });
        
        await batch.commit();
        console.log(`ID ${productId} 庫存調整成功`);

    } catch (error) {
        console.error("庫存調整失敗: ", error);
        throw error;
    }
};

/**
 * (新增) 獲取所有的庫存歷史紀錄
 * @returns Promise<(InventoryHistory & { id: string })[]>
 */
export const getAllInventoryHistory = async (): Promise<(InventoryHistory & { id: string })[]> => {
    try {
        const q = query(historyCollectionRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as InventoryHistory & { id: string }));
    } catch (error) {
        console.error("讀取全域庫存歷史紀錄失敗: ", error);
        return [];
    }
};

// deleteProduct 保持不變...
export const deleteProduct = async (id: string): Promise<void> => {
    try {
        const productDocRef = doc(db, "products", id);
        await deleteDoc(productDocRef);
        console.log("Product successfully deleted!");
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw error;
    }
};
