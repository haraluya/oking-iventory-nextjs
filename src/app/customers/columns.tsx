// src/app/customers/columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "@/types/firestore";

type CustomerWithId = Customer & { id: string };

// 定義 getColumns 函式接收的 props 型別
export type CustomerColumnsProps = {
  onEdit: (customer: CustomerWithId) => void;
  onDelete: (id: string, name: string) => void;
};

// 將欄位定義導出為一個函式
export const getColumns = ({ onEdit, onDelete }: CustomerColumnsProps): ColumnDef<CustomerWithId>[] => [
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
    accessorKey: "customerCode",
    header: "客戶編碼",
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        客戶名稱
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "level",
    header: "等級",
    cell: ({ row }) => {
      const level = row.getValue("level") as Customer['level'];
      
      const levelInfo: Record<Customer['level'], { text: string; variant: "default" | "secondary" | "outline" }> = {
        gold: { text: '金牌', variant: 'default' },
        silver: { text: '銀牌', variant: 'secondary' },
        bronze: { text: '銅牌', variant: 'outline' },
        retail: { text: '零售', variant: 'outline' }
      };

      const info = levelInfo[level] || { text: level, variant: 'outline' };

      return <Badge variant={info.variant}>{info.text}</Badge>;
    }
  },
  {
    accessorKey: "taxId",
    header: "統一編號",
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
    accessorKey: "isActive",
    header: "狀態",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return isActive 
        ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">啟用中</Badge> 
        : <Badge variant="destructive">已停用</Badge>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              編輯客戶
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 focus:bg-red-50"
              onClick={() => onDelete(customer.id, customer.name)}
            >
              刪除客戶
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
