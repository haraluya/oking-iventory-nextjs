// src/app/sales/columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import type { SalesOrder } from "@/types/firestore";
import { Timestamp } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreHorizontal, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SalesOrderColumnsProps = {
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onShip: (order: SalesOrder & { id: string }) => void; // 新增出貨處理函式
}

// ... (格式化函式保持不變)
const formatDate = (timestamp: Timestamp | any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('zh-TW');
};
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
const getStatusBadge = (status: SalesOrder['status']) => {
    switch (status) {
        case 'pending-approval': return <Badge variant="outline">待批准</Badge>;
        case 'pending-shipment': return <Badge variant="secondary">待出貨</Badge>;
        case 'completed': return <Badge className="bg-green-600">已完成</Badge>;
        case 'cancelled': return <Badge variant="destructive">已取消</Badge>;
        default: return <Badge>{status}</Badge>;
    }
}

export const getSalesOrderColumns = ({ onApprove, onCancel, onShip }: SalesOrderColumnsProps): ColumnDef<SalesOrder & { id: string }>[] => [
    // ... (其他欄位保持不變)
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            訂單日期 <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
        accessorKey: "orderNumber",
        header: "訂單號碼",
    },
    {
        accessorKey: "customerInfo.name",
        header: "客戶名稱",
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
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original;
            
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        {/* 根據不同狀態顯示不同選項 */}
                        {order.status === 'pending-approval' && (
                            <>
                                <DropdownMenuItem onClick={() => onApprove(order.id)}>
                                    批准訂單
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-red-500 focus:text-red-500"
                                    onClick={() => onCancel(order.id)}>
                                    取消訂單
                                </DropdownMenuItem>
                            </>
                        )}
                        {order.status === 'pending-shipment' && (
                            <DropdownMenuItem onClick={() => onShip(order)}>
                                <Truck className="mr-2 h-4 w-4" />
                                <span>執行出貨</span>
                            </DropdownMenuItem>
                        )}
                         {/* 可以為已完成訂單新增 '查看詳情' 等操作 */}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
