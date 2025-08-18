// src/app/inventory/columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types/firestore";
import { Input } from "@/components/ui/input";

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

// (已修改) 更新貨幣格式化函式
const formatCurrency = (amount: number) => {
  // 1. 先無條件進位
  const roundedAmount = Math.ceil(amount);
  // 2. 格式化為沒有小數點的貨幣
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount);
};

type GetColumnsProps = {
  onAdjust: (product: Product & { id: string }) => void;
  isStocktakeMode: boolean;
  stockChanges: { [key: string]: number };
  onStockChange: (id: string, newStock: number) => void;
};

export const getColumns = ({
  onAdjust,
  isStocktakeMode,
  stockChanges,
  onStockChange,
}: GetColumnsProps): ColumnDef<Product & { id: string }>[] => [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        SKU <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.original.sku}</div>,
  },
  {
    accessorKey: "name",
    header: "商品名稱",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "spec",
    header: "商品規格",
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => (
      <div className="text-right">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          目前庫存 <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const product = row.original;
      if (isStocktakeMode) {
        return (
          <Input
            type="number"
            value={stockChanges[product.id] ?? product.currentStock}
            onChange={(e) => onStockChange(product.id, parseInt(e.target.value, 10) || 0)}
            className="text-right font-mono h-8"
          />
        );
      }
      return <div className="text-right font-mono pr-4">{formatNumber(product.currentStock)}</div>;
    },
  },
  {
    accessorKey: "averageCost",
    header: ({ column }) => (
      <div className="text-right">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          平均成本 <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-right font-mono pr-4">{formatCurrency(row.original.averageCost)}</div>,
  },
  {
    id: "totalCost",
    header: () => <div className="text-right pr-4">庫存總成本</div>,
    cell: ({ row }) => {
      const stock = row.original.currentStock || 0;
      const cost = row.original.averageCost || 0;
      return <div className="text-right font-mono font-bold pr-4">{formatCurrency(stock * cost)}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
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
            <DropdownMenuItem onClick={() => onAdjust(product)}>
              調整庫存
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
