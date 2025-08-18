// src/app/customers/page.tsx
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

// 1. 引入新的 columns 檔案
import { getColumns } from './columns';
import { getAllCustomers, deleteCustomer } from '@/lib/customerApi';
import type { Customer } from '@/types/firestore';
import CustomerForm from '@/components/CustomerForm';
import { useModal } from '@/context/ModalContext';
import { toast } from 'sonner';

type CustomerWithId = Customer & { id: string };

// DataTable 元件 (保持不變)
function DataTable<TData, TValue>({ columns, data }: { columns: ColumnDef<TData, TValue>[], data: TData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting, getSortedRowModel: getSortedRowModel(), onColumnFiltersChange: setColumnFilters, getFilteredRowModel: getFilteredRowModel(), state: { sorting, columnFilters } });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input placeholder="搜尋客戶名稱..." value={(table.getColumn("name")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)} className="max-w-sm" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">沒有資料。</TableCell></TableRow>)}
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
export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerWithId | null>(null);
  const { showConfirmation } = useModal();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const fetchedCustomers = await getAllCustomers();
    setCustomers(fetchedCustomers);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEdit = (customer: CustomerWithId) => {
    setCustomerToEdit(customer);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setCustomerToEdit(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmation(`您確定要刪除客戶 "${name}" 嗎？`);
    if (confirmed) {
      try {
        await deleteCustomer(id);
        toast.success(`客戶 ${name} 已成功刪除。`);
        fetchCustomers();
      } catch (error) {
        toast.error('刪除客戶失敗，請稍後再試。');
      }
    }
  };

  // 3. 更新 useMemo 來呼叫從外部引入的 getColumns
  const columns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete }), [customers]);

  if (loading && customers.length === 0) {
    return <div>讀取中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">客戶管理</h1>
        <Button onClick={handleAdd}>新增客戶</Button>
      </div>
      <DataTable columns={columns} data={customers} />
      <CustomerForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={fetchCustomers} customerToEdit={customerToEdit} />
    </div>
  );
}
