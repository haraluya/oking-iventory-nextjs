// src/app/purchases/columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import type { PurchaseOrder } from "@/types/firestore";
import { Timestamp } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// 格式化日期
const formatDate = (timestamp: Timestamp | any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('zh-TW');
};

// 格式化貨幣
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// 根據訂單狀態顯示不同的 Badge
const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
        case 'pending-receipt': return <Badge variant="secondary">待收貨</Badge>;
        case 'completed': return <Badge className="bg-green-600">已完成</Badge>;
        case 'cancelled': return <Badge variant="destructive">已取消</Badge>;
        default: return <Badge>{status}</Badge>;
    }
}

export const columns: ColumnDef<PurchaseOrder & { id: string }>[] = [
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            採購日期 <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
        accessorKey: "orderNumber",
        header: "採購單號",
    },
    {
        accessorKey: "supplierInfo.name",
        header: "供應商名稱",
    },
    {
        accessorKey: "status",
        header: "訂單狀態",
        cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">總金額</div>,
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.original.totalAmount)}</div>,
    },
    // 之後可以加入「操作」欄位來收貨入庫
];
