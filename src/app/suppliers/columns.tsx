// src/app/suppliers/columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Supplier } from "@/types/firestore";

// 定義 getColumns 函式接收的 props 型別
type ColumnsProps = {
  onEdit: (supplier: Supplier & { id: string }) => void;
  onDelete: (id: string) => void;
};

// 這是 TanStack Table 的核心，定義了表格的每一欄如何顯示
export const getColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<Supplier & { id: string }>[] => [
  {
    accessorKey: "supplierCode",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          供應商編碼
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "name",
    header: "供應商名稱",
  },
  {
    accessorKey: "contactPerson",
    header: "聯絡人",
  },
  {
    accessorKey: "phone",
    header: "聯絡電話",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;

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
            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              編輯
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(supplier.id)}
              className="text-red-600"
            >
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
