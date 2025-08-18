// src/app/suppliers/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";

import { getColumns } from './columns';
import { getAllSuppliers, deleteSupplier } from '@/lib/supplierApi';
import type { Supplier } from '@/types/firestore';
import SupplierForm from '@/components/SupplierForm';
// 假設您有一個全域的 ModalContext 來處理確認對話框
// 如果沒有，您可以使用 window.confirm 或 shadcn/ui 的 AlertDialog
import { useModal } from '@/context/ModalContext'; 
import { toast } from 'sonner';

// 為了重用，將 DataTable 抽出成一個獨立元件
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="搜尋供應商名稱..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  沒有資料。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>上一頁</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>下一頁</Button>
      </div>
    </div>
  );
}

// 主頁面元件
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<(Supplier & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<(Supplier & { id: string }) | null>(null);
  const { showConfirmation } = useModal();

  // 使用 useCallback 包裝 fetch 函式，避免不必要的重新渲染
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const fetchedSuppliers = await getAllSuppliers();
    setSuppliers(fetchedSuppliers);
    setLoading(false);
  }, []);

  // 在元件掛載時獲取資料
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // 處理編輯按鈕點擊
  const handleEdit = (supplier: Supplier & { id: string }) => {
    setSupplierToEdit(supplier);
    setIsFormOpen(true);
  };

  // 處理新增按鈕點擊
  const handleAdd = () => {
    setSupplierToEdit(null); // 清空編輯狀態，確保是新增模式
    setIsFormOpen(true);
  };

  // 處理刪除按鈕點擊
  const handleDelete = async (id: string) => {
    const supplierToDelete = suppliers.find(s => s.id === id);
    if (!supplierToDelete) return;

    const confirmed = await showConfirmation(`您確定要刪除供應商 "${supplierToDelete.name}" 嗎？此操作無法復原。`);
    if (confirmed) {
      try {
        await deleteSupplier(id);
        toast.success(`供應商 ${supplierToDelete.name} 已成功刪除。`);
        fetchSuppliers(); // 重新整理列表
      } catch (error) {
        toast.error('刪除供應商失敗，請稍後再試。');
        console.error(error);
      }
    }
  };

  // 使用 useMemo 來記憶 columns 的計算結果，只有在 handleEdit 或 handleDelete 變動時才重新計算
  const columns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete }), [suppliers]);

  // 初始載入畫面
  if (loading && suppliers.length === 0) {
    return <div>讀取中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">供應商管理</h1>
        <Button onClick={handleAdd}>新增供應商</Button>
      </div>
      <DataTable columns={columns} data={suppliers} />

      {/* 將表單元件掛載到頁面上，並傳入所需的 props */}
      <SupplierForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchSuppliers}
        supplierToEdit={supplierToEdit}
      />
    </div>
  );
}
