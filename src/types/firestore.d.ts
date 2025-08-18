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
 * 2. `inventory` (庫存管理集合) - 註：此集合可能已由 inventory_history 取代
 */
export interface Inventory {
  currentStock: number;
  averageCost: number;
}

/**
 * `inventory_history` (全域庫存歷史紀錄集合)
 */
export interface InventoryHistory {
  productId: string; 
  productSku: string;
  productName: string;
  type: "purchase-in" | "sales-out" | "adjustment" | "customer-return" | "supplier-return";
  change: number;
  stockAfter: number;
  note?: string;
  userId: string;
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
  items: SalesOrderItem[];
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
 * 6. `purchaseOrders` (採購訂單集合) - 新增
 */
export interface PurchaseOrderItem {
  sku: string;
  name: string;
  spec: string;
  quantity: number;
  unitCost: number; // 進貨成本
  subtotal: number;
}

export interface PurchaseOrder {
  orderNumber: string;
  supplierId: string;
  supplierInfo: { name: string; taxId?: string; };
  items: PurchaseOrderItem[];
  status: "pending-receipt" | "completed" | "cancelled";
  totalAmount: number;
  internalNote?: string;
  createdBy: string; // userId
  receivedBy?: string; // userId
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  receivedAt?: Timestamp | FieldValue;
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
