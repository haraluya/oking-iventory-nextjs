// src/app/products/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/types/firestore"

type ProductWithId = Product & { id: string };

// 更新 props 型別，移除 onShowHistory
export type ProductColumnsProps = {
  onEdit: (product: ProductWithId) => void;
  onDelete: (id: string, name: string) => void;
  onAdjustStock: (product: ProductWithId) => void;
}

export const getColumns = ({ onEdit, onDelete, onAdjustStock }: ProductColumnsProps): ColumnDef<ProductWithId>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        SKU
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: "商品名稱",
  },
  {
    accessorKey: "brand",
    header: "品牌",
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => (
        <div className="text-center">
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                目前庫存
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </div>
    ),
    cell: ({ row }) => <div className="text-center font-mono">{row.original.currentStock}</div>
  },
  {
    accessorKey: "prices.retail",
    header: () => <div className="text-right">零售價</div>,
    cell: ({ row }) => {
      const amount = row.original.prices.retail;
      const formatted = new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        minimumFractionDigits: 0,
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>主要操作</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(product)}>
              編輯商品
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 focus:bg-red-50"
              onClick={() => onDelete(product.id, product.name)}
            >
              刪除商品
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>庫存管理</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAdjustStock(product)}>
              調整庫存
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.sku)}
            >
              複製 SKU
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
