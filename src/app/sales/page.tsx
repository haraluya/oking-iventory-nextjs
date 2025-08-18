// src/app/sales/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
import { toast } from 'sonner';

import { getSalesOrderColumns } from './columns';
import { getAllSalesOrders, updateOrderStatus, shipSalesOrder } from '@/lib/salesOrderApi';
import type { SalesOrder } from '@/types/firestore';
import { useModal } from '@/context/ModalContext'; // 引入 Modal Context

// DataTable 元件保持不變
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
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
    getSubRows: row => (row as any).subRows,
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="搜尋客戶名稱..."
          value={(table.getColumn("customerInfo_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("customerInfo_name")?.setFilterValue(event.target.value)}
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
                  沒有銷售訂單。
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

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<(SalesOrder & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirmation } = useModal(); // 使用確認對話框

  const fetchSalesOrders = useCallback(async () => {
    setLoading(true);
    const fetchedOrders = await getAllSalesOrders();
    setSalesOrders(fetchedOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);
  
  const handleApproveOrder = async (orderId: string) => {
      try {
          await updateOrderStatus(orderId, 'pending-shipment');
          toast.success("訂單已批准，狀態更新為「待出貨」。");
          fetchSalesOrders();
      } catch (error) {
          toast.error("批准失敗，請稍後再試。");
          console.error(error);
      }
  };

  const handleCancelOrder = async (orderId: string) => {
      const confirmed = await showConfirmation("您確定要取消這筆訂單嗎？");
      if (confirmed) {
        try {
            await updateOrderStatus(orderId, 'cancelled');
            toast.info("訂單已取消。");
            fetchSalesOrders();
        } catch (error) {
            toast.error("取消失敗，請稍後再試。");
            console.error(error);
        }
      }
  };

  // 新增：處理出貨的函式
  const handleShipOrder = async (order: SalesOrder & { id: string }) => {
    const confirmed = await showConfirmation(`您確定要為訂單 ${order.orderNumber} 執行出貨嗎？此動作將會扣除庫存。`);
    if (confirmed) {
        try {
            await shipSalesOrder(order);
            toast.success(`訂單 ${order.orderNumber} 已成功出貨！`);
            fetchSalesOrders();
        } catch (error: any) {
            toast.error(`出貨失敗: ${error.message}`);
            console.error(error);
        }
    }
  };

  const columns = useMemo(() => getSalesOrderColumns({
    onApprove: handleApproveOrder,
    onCancel: handleCancelOrder,
    onShip: handleShipOrder, // 將新的處理函式傳入
  }), [fetchSalesOrders]);


  if (loading) {
    return <div className="container mx-auto py-10">讀取銷售單資料中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">銷售單管理</h1>
        <Button asChild>
          <Link href="/sales/new">新增銷售單</Link>
        </Button>
      </div>
      <DataTable columns={columns} data={salesOrders} />
    </div>
  );
}
