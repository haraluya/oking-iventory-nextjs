// src/app/inventory/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link'; // 引入 Link 元件
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
import { getAllProducts, adjustStock } from '@/lib/productApi';
import type { Product } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import InventoryAdjustmentForm from '@/components/InventoryAdjustmentForm';
import { toast } from 'sonner';
import { useModal } from '@/context/ModalContext';

type ProductWithId = Product & { id: string };

// DataTable 元件
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
  );
}


export default function InventoryPage() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirmation } = useModal();

  // 簡化 Dialog states
  const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);

  // Stock-take mode states
  const [isStocktakeMode, setIsStocktakeMode] = useState(false);
  const [stockChanges, setStockChanges] = useState<{ [key: string]: number }>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const fetchedProducts = await getAllProducts();
    setProducts(fetchedProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAdjustmentForm = (product: ProductWithId) => {
    setSelectedProduct(product);
    setIsAdjustmentFormOpen(true);
  };

  // Handlers for stock-take mode
  const handleStockChange = (id: string, newStock: number) => {
    setStockChanges(prev => ({ ...prev, [id]: newStock }));
  };

  const handleToggleStocktakeMode = () => {
    if (isStocktakeMode && Object.keys(stockChanges).length > 0) {
       showConfirmation("您有未儲存的變更，確定要離開盤點模式嗎？所有變變更將會遺失。")
        .then(confirmed => {
            if (confirmed) {
                setIsStocktakeMode(false);
                setStockChanges({});
            }
        });
    } else {
        setIsStocktakeMode(!isStocktakeMode);
        setStockChanges({});
    }
  };

  const handleSaveChanges = async () => {
    const changesCount = Object.keys(stockChanges).length;
    if (changesCount === 0) {
      toast.info("沒有任何庫存變更需要儲存。");
      return;
    }

    const confirmed = await showConfirmation(`您確定要儲存 ${changesCount} 項庫存變更嗎？`);
    if (!confirmed) return;

    setIsSaving(true);
    const promises = Object.entries(stockChanges).map(([id, newStock]) => {
        const product = products.find(p => p.id === id);
        if (product && product.currentStock !== newStock) {
            return adjustStock(id, newStock, "大量盤點模式更新");
        }
        return Promise.resolve();
    });

    try {
        await Promise.all(promises);
        toast.success("所有庫存變更已成功儲存！");
        setIsStocktakeMode(false);
        setStockChanges({});
        fetchProducts();
    } catch (error) {
        console.error(error);
        toast.error("儲存部分變更時發生錯誤，請檢查後再試。");
    } finally {
        setIsSaving(false);
    }
  };

  const columns = useMemo(() => getColumns({
    onAdjust: handleOpenAdjustmentForm,
    isStocktakeMode,
    stockChanges,
    onStockChange: handleStockChange,
  }), [isStocktakeMode, stockChanges, products]);

  if (loading) {
    return <div>讀取庫存資料中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">庫存總覽</h1>
        <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/inventory/history">查看盤點總紀錄</Link>
            </Button>
            {isStocktakeMode && (
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? "儲存中..." : `儲存 ${Object.keys(stockChanges).length} 項變更`}
                </Button>
            )}
            <Button onClick={handleToggleStocktakeMode} variant={isStocktakeMode ? "destructive" : "outline"}>
                {isStocktakeMode ? "結束盤點" : "進入盤點模式"}
            </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isStocktakeMode 
            ? "您已進入大量盤點模式，可以直接在表格中修改庫存數量，完成後請點擊儲存。"
            : "此處顯示即時庫存狀態。您可進入「盤點模式」進行大量修改，或對單一品項操作。"
        }
      </p>
      <DataTable columns={columns} data={products} />

      <InventoryAdjustmentForm
        isOpen={isAdjustmentFormOpen}
        onOpenChange={setIsAdjustmentFormOpen}
        onSuccess={fetchProducts}
        productToAdjust={selectedProduct}
      />
    </div>
  );
}
