// src/app/inventory/history/columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import type { InventoryHistory } from "@/types/firestore";
import { Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatTimestamp = (timestamp: Timestamp | any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-');
};

const getTypeLabel = (type: InventoryHistory['type']) => {
    switch (type) {
        case 'adjustment': return <Badge variant="destructive">庫存調整</Badge>;
        case 'purchase-in': return <Badge variant="default">進貨</Badge>;
        case 'sales-out': return <Badge variant="secondary">銷貨</Badge>;
        default: return <Badge variant="outline">{type}</Badge>;
    }
}

export const columns: ColumnDef<InventoryHistory & { id: string }>[] = [
    {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            時間 <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatTimestamp(row.original.timestamp),
    },
    {
        accessorKey: "productSku",
        header: "商品 SKU",
    },
    {
        accessorKey: "productName",
        header: "商品名稱",
    },
    {
        accessorKey: "type",
        header: "類型",
        cell: ({ row }) => getTypeLabel(row.original.type),
    },
    {
        accessorKey: "change",
        header: () => <div className="text-right">變動量</div>,
        cell: ({ row }) => {
            const change = row.original.change;
            return (
                <div className={`text-right font-mono ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? `+${change}` : change}
                </div>
            );
        },
    },
    {
        accessorKey: "stockAfter",
        header: () => <div className="text-right">變動後庫存</div>,
        cell: ({ row }) => <div className="text-right font-mono">{row.original.stockAfter}</div>,
    },
    {
        accessorKey: "note",
        header: "備註",
    },
    {
        accessorKey: "userId",
        header: "操作者",
        cell: ({ row }) => <div className="text-xs truncate" title={row.original.userId}>{row.original.userId.substring(0, 8)}...</div>,
    },
];
