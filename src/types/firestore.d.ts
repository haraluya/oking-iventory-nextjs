import type { Timestamp, FieldValue } from "firebase/firestore";

/**
 * 通用地址物件
 */
interface Address {
  zipCode: string;
  city: string;
  district: string;
  street: string;
}

/**
 * 1. `products` (商品集合)
 */
export interface Product {
  sku: string;
  barcode?: string;
  brand: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  description: string;
  imageUrl?: string;
  prices: {
    retail: number;
    bronze: number;
    silver: number;
    gold: number;
  };
  currentStock: number; // 冗餘
  averageCost: number; // 冗餘
  lowStockThreshold?: number;
  supplierId?: string;
  isActive: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 2. `inventory` (庫存管理集合)
 */
export interface Inventory {
  currentStock: number;
  averageCost: number;
}

export interface InventoryHistory {
  type: "purchase-in" | "sales-out" | "adjustment" | "customer-return" | "supplier-return";
  change: number;
  stockAfter: number;
  costBefore?: number;
  costAfter?: number;
  relatedDocId: string;
  userId: string;
  note?: string;
  timestamp: Timestamp | FieldValue;
}

/**
 * 3. `customers` (客戶集合)
 */
export interface Customer {
  customerCode: string;
  name: string;
  level: "retail" | "bronze" | "silver" | "gold";
  contactPerson?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: Address;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 4. `suppliers` (供應商集合)
 */
export interface Supplier {
  supplierCode: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: Address;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 5. `salesOrders` (銷售訂單集合)
 */
export interface SalesOrderItem {
  sku: string;
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitCost?: number; // 出貨時寫入
}

export interface SalesOrder {
  orderNumber: string;
  customerId: string;
  customerInfo: { name: string; level: string; taxId?: string; };
  shippingAddress: Address;
  status: "pending-approval" | "pending-shipment" | "completed" | "cancelled" | "partially-shipped";
  paymentStatus: "unpaid" | "partially-paid" | "paid";
  totalAmount: number;
  totalCost?: number;
  grossProfit?: number;
  invoiceNumber?: string;
  shippingNote?: string;
  internalNote?: string;
  createdBy: string; // userId
  approvedBy?: string; // userId
  shippedBy?: string; // userId
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  approvedAt?: Timestamp | FieldValue;
  shippedAt?: Timestamp | FieldValue;
}

/**
 * 7. `users` (使用者與權限集合)
 */
export interface UserProfile {
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "warehouse" | "sales" | "finance";
  isActive: boolean;
  lastLoginAt: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
}