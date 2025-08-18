// src/lib/reportsApi.ts
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { SalesOrder } from "@/types/firestore";

interface FinancialSummary {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  orderCount: number;
  orders: (SalesOrder & { id: string })[];
}

/**
 * 獲取指定日期區間內的財務摘要
 * @param startDate - 開始日期
 * @param endDate - 結束日期
 * @returns Promise<FinancialSummary>
 */
export const getFinancialSummary = async (startDate: Date, endDate: Date): Promise<FinancialSummary> => {
  // Firestore Timestamps need to be created from the dates
  const startTimestamp = Timestamp.fromDate(startDate);
  // Set end date to the end of the day
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  const salesOrdersRef = collection(db, "salesOrders");
  // 查詢狀態為 "completed" 且 shippedAt 在指定區間內的訂單
  // 注意：Firestore 需要為此查詢建立複合索引
  const q = query(
    salesOrdersRef,
    where("status", "==", "completed"),
    where("shippedAt", ">=", startTimestamp),
    where("shippedAt", "<=", endTimestamp)
  );

  try {
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SalesOrder & { id: string }));

    let totalSales = 0;
    let totalCost = 0;

    orders.forEach(order => {
      totalSales += order.totalAmount;
      totalCost += order.totalCost || 0; // 如果沒有 totalCost，則視為 0
    });

    const grossProfit = totalSales - totalCost;
    const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    return {
      totalSales,
      totalCost,
      grossProfit,
      grossMargin,
      orderCount: orders.length,
      orders,
    };
  } catch (error) {
    console.error("生成財務報表時發生錯誤: ", error);
    // 如果是索引錯誤，在控制台會有提示
    // e.g., "The query requires an index. You can create it here: ..."
    throw new Error("查詢失敗，可能是資料庫索引尚未建立。");
  }
};

/**
 * 獲取指定客戶在特定日期區間的對帳單
 * @param customerId - 客戶 ID
 * @param startDate - 開始日期
 * @param endDate - 結束日期
 * @returns Promise<(SalesOrder & { id: string })[]>
 */
export const getCustomerStatement = async (customerId: string, startDate: Date, endDate: Date): Promise<(SalesOrder & { id: string })[]> => {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const salesOrdersRef = collection(db, "salesOrders");
    const q = query(
        salesOrdersRef,
        where("customerId", "==", customerId),
        where("status", "==", "completed"),
        where("shippedAt", ">=", startTimestamp),
        where("shippedAt", "<=", endTimestamp)
    );

    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SalesOrder & { id: string }));
    } catch (error) {
        console.error("生成客戶對帳單時發生錯誤: ", error);
        throw new Error("查詢失敗，可能是資料庫索引尚未建立。");
    }
};
