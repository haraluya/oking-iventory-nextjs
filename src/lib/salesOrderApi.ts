// src/lib/salesOrderApi.ts
import { collection, getDocs, query, orderBy, doc, setDoc, serverTimestamp, updateDoc, writeBatch, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { SalesOrder, SalesOrderItem, Product, InventoryHistory } from "@/types/firestore";

const salesOrdersCollectionRef = collection(db, "salesOrders");
const productsCollectionRef = collection(db, "products");
const historyCollectionRef = collection(db, "inventory_history");

/**
 * 獲取所有銷售訂單列表
 */
export const getAllSalesOrders = async (): Promise<(SalesOrder & { id: string })[]> => {
    try {
        const q = query(salesOrdersCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SalesOrder & { id: string }));
    } catch (error) {
        console.error("讀取銷售訂單時發生錯誤: ", error);
        return [];
    }
};

/**
 * 新增或更新一個銷售訂單
 */
export const upsertSalesOrder = async (order: Omit<SalesOrder, 'createdAt' | 'updatedAt' | 'id' | 'createdBy'> & { id?: string }) => {
    // ... (此函式保持不變)
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("使用者未登入，無法建立訂單");

    try {
        const orderDocRef = order.id ? doc(db, "salesOrders", order.id) : doc(salesOrdersCollectionRef);
        const { id, ...dataToSave } = order;

        await setDoc(orderDocRef, {
            ...dataToSave,
            updatedAt: serverTimestamp(),
            ...( !order.id && { 
                createdAt: serverTimestamp(),
                createdBy: userId,
            }),
        }, { merge: true });

        return orderDocRef.id;
    } catch (error) {
        console.error("寫入銷售訂單時發生錯誤: ", error);
        throw error;
    }
};

/**
 * 更新銷售訂單的狀態 (用於批准、取消等簡單狀態變更)
 */
export const updateOrderStatus = async (orderId: string, newStatus: SalesOrder['status']) => {
    // ... (此函式保持不變)
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("使用者未登入，無法更新狀態");

    const orderDocRef = doc(db, "salesOrders", orderId);
    
    try {
        const updateData: any = {
            status: newStatus,
            updatedAt: serverTimestamp(),
        };

        if (newStatus === 'pending-shipment') {
            updateData.approvedBy = userId;
            updateData.approvedAt = serverTimestamp();
        }

        await updateDoc(orderDocRef, updateData);
        console.log(`訂單 ${orderId} 狀態已更新為 ${newStatus}`);
    } catch (error) {
        console.error(`更新訂單 ${orderId} 狀態失敗:`, error);
        throw error;
    }
};

/**
 * (新增) 執行出貨流程：更新訂單、扣庫存、寫入歷史
 * @param order - 要出貨的完整訂單物件
 */
export const shipSalesOrder = async (order: SalesOrder & { id: string }) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("使用者未登入，無法執行出貨");

    const batch = writeBatch(db);
    let totalCost = 0;
    const updatedItems: SalesOrderItem[] = [];

    try {
        // 1. 遍歷訂單中的每一個品項，處理庫存和成本
        for (const item of order.items) {
            const productRef = doc(productsCollectionRef, item.sku); // 假設商品 ID 就是 SKU
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                throw new Error(`找不到商品 SKU: ${item.sku}`);
            }

            const productData = productSnap.data() as Product;
            const itemCost = productData.averageCost;
            const newStock = productData.currentStock - item.quantity;

            if (newStock < 0) {
                throw new Error(`商品 "${productData.name}" 庫存不足，無法出貨。`);
            }

            // 1a. 準備更新商品庫存
            batch.update(productRef, { currentStock: newStock });

            // 1b. 準備寫入庫存歷史紀錄
            const historyRef = doc(historyCollectionRef);
            const historyDoc: Omit<InventoryHistory, 'timestamp'> = {
                productId: productRef.id,
                productSku: productData.sku,
                productName: productData.name,
                type: "sales-out",
                change: -item.quantity,
                stockAfter: newStock,
                note: `銷售單: ${order.orderNumber}`,
                userId: userId,
            };
            batch.set(historyRef, { ...historyDoc, timestamp: serverTimestamp() });
            
            // 1c. 累加總成本並記錄單品成本
            totalCost += itemCost * item.quantity;
            updatedItems.push({ ...item, unitCost: itemCost });
        }

        // 2. 準備更新銷售訂單的最終狀態
        const orderRef = doc(salesOrdersCollectionRef, order.id);
        const grossProfit = order.totalAmount - totalCost;
        batch.update(orderRef, {
            status: 'completed',
            shippedBy: userId,
            shippedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            items: updatedItems, // 更新含有單位成本的品項列表
            totalCost: totalCost,
            grossProfit: grossProfit,
        });

        // 3. 執行所有資料庫寫入操作
        await batch.commit();
        console.log(`訂單 ${order.orderNumber} 已成功出貨。`);

    } catch (error) {
        console.error("出貨流程失敗:", error);
        throw error; // 將錯誤向上拋出，讓前端可以捕捉
    }
};
