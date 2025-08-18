// src/app/products/page.tsx
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
import { getAllProducts, deleteProduct } from '@/lib/productApi';
import type { Product } from '@/types/firestore';
import ProductForm from '@/components/ProductForm';
import InventoryAdjustmentForm from '@/components/InventoryAdjustmentForm';
import { useModal } from '@/context/ModalContext';
import { toast } from 'sonner';

type ProductWithId = Product & { id: string };

// DataTable 元件保持不變
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

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
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="搜尋商品名稱..."
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
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductWithId | null>(null);
  const { showConfirmation } = useModal();

  // 只保留庫存調整視窗的 state
  const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);

  const fetchProducts = useCallback(async () => {
    const fetchedProducts = await getAllProducts();
    setProducts(fetchedProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = (product: ProductWithId) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenAdjustmentForm = (product: ProductWithId) => {
    setSelectedProduct(product);
    setIsAdjustmentFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmation(`您確定要刪除商品 "${name}" 嗎？此操作無法復原。`);
    if (confirmed) {
      try {
        await deleteProduct(id);
        toast.success(`商品 ${name} 已成功刪除。`);
        fetchProducts();
      } catch (error) {
        toast.error('刪除商品失敗，請稍後再試。');
        console.error(error);
      }
    }
  };

  const columns = useMemo(() => getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onAdjustStock: handleOpenAdjustmentForm,
  }), [products]);

  if (loading && products.length === 0) {
    return <div>讀取中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">商品管理</h1>
        <Button onClick={handleAdd}>新增商品</Button>
      </div>
      <DataTable columns={columns} data={products} />

      <ProductForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchProducts}
        productToEdit={productToEdit}
      />

      <InventoryAdjustmentForm
        isOpen={isAdjustmentFormOpen}
        onOpenChange={setIsAdjustmentFormOpen}
        onSuccess={fetchProducts}
        productToAdjust={selectedProduct}
      />
    </div>
  );
}
