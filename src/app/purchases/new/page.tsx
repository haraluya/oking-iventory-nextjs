// src/app/purchases/new/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { auth } from '@/lib/firebase';
import { getAllSuppliers } from '@/lib/supplierApi';
import { getAllProducts } from '@/lib/productApi';
import { upsertPurchaseOrder } from '@/lib/purchaseOrderApi';

import type { Supplier, Product, PurchaseOrder, PurchaseOrderItem } from '@/types/firestore';

type SupplierWithId = Supplier & { id: string };
type ProductWithId = Product & { id: string };

const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${year}${month}${day}-${randomPart}`;
};

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierWithId[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithId | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [suppliersData, productsData] = await Promise.all([
          getAllSuppliers(),
          getAllProducts(),
        ]);
        setSuppliers(suppliersData);
        setProducts(productsData);
      } catch (error) {
        console.error("讀取基礎資料失敗:", error);
        toast.error("讀取供應商或商品資料失敗。");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectSupplier = (supplier: SupplierWithId) => {
    setSelectedSupplier(supplier);
    setSupplierPopoverOpen(false);
    setOrderItems([]); 
    toast.info(`已選擇供應商: ${supplier.name}`);
  };

  const handleAddProduct = (product: ProductWithId) => {
    if (!selectedSupplier) {
      toast.warning("請先選擇一位供應商。");
      return;
    }
    if (orderItems.some(item => item.sku === product.sku)) {
      toast.info(`商品 ${product.name} 已在訂單中，請直接修改數量。`);
      return;
    }

    const newItem: PurchaseOrderItem = {
      sku: product.sku,
      name: product.name,
      spec: product.spec,
      quantity: 1,
      unitCost: product.averageCost || 0, // 預設帶入平均成本，可修改
      subtotal: product.averageCost || 0,
    };

    setOrderItems([...orderItems, newItem]);
    setProductPopoverOpen(false);
  };

  const handleItemChange = (sku: string, field: 'quantity' | 'unitCost', value: number) => {
    const newValue = Math.max(0, value); // 數量和成本不能是負數
    setOrderItems(orderItems.map(item => {
      if (item.sku === sku) {
        const updatedItem = { ...item, [field]: newValue };
        if (field === 'quantity' || field === 'unitCost') {
            updatedItem.subtotal = updatedItem.quantity * updatedItem.unitCost;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoveItem = (sku: string) => {
    setOrderItems(orderItems.filter(item => item.sku !== sku));
  };

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [orderItems]);

  const handleSaveOrder = async () => {
    if (!selectedSupplier) {
      toast.error("未選擇供應商。");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("訂單中沒有任何商品。");
      return;
    }
    if (!auth.currentUser) {
        toast.error("您尚未登入，無法建立訂單。");
        return;
    }

    setIsSaving(true);
    try {
      const newOrder: Omit<PurchaseOrder, 'createdAt' | 'updatedAt' | 'id' | 'createdBy'> = {
        orderNumber: generateOrderNumber(),
        supplierId: selectedSupplier.id,
        supplierInfo: { 
            name: selectedSupplier.name, 
            taxId: selectedSupplier.taxId || '',
        },
        items: orderItems,
        totalAmount: totalAmount,
        status: 'pending-receipt', // 初始狀態
      };
      
      await upsertPurchaseOrder(newOrder); 
      
      toast.success("採購單已成功建立！初始狀態為「待收貨」。");
      router.push('/purchases'); // 成功後跳轉回列表頁 (假設列表頁路徑為 /purchases)
    } catch (error) {
      console.error("儲存採購單失敗:", error);
      toast.error("儲存失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">正在載入資料...</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">建立採購單</h1>
        <Button onClick={() => router.back()}>返回列表</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>1. 選擇供應商</CardTitle></CardHeader>
            <CardContent>
              <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedSupplier ? selectedSupplier.name : "選擇一位供應商..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="搜尋供應商名稱..." />
                    <CommandList>
                      <CommandEmpty>找不到供應商。</CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((supplier) => (
                          <CommandItem key={supplier.id} value={supplier.name} onSelect={() => handleSelectSupplier(supplier)}>
                            {supplier.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>2. 新增商品</CardTitle></CardHeader>
            <CardContent>
              <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!selectedSupplier}>
                    新增商品至採購單...
                    <PlusCircle className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="搜尋 SKU 或商品名稱..." />
                    <CommandList>
                      <CommandEmpty>找不到商品。</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem key={product.id} value={`${product.sku} ${product.name}`} onSelect={() => handleAddProduct(product)}>
                            {product.sku} - {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>3. 採購明細</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名稱</TableHead>
                      <TableHead className="w-[120px] text-center">數量</TableHead>
                      <TableHead className="w-[150px] text-right">進貨成本</TableHead>
                      <TableHead className="text-right">小計</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.length > 0 ? (
                      orderItems.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="text-center"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.sku, 'quantity', parseInt(e.target.value) || 0)}
                              min="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="text-right"
                              value={item.unitCost}
                              onChange={(e) => handleItemChange(item.sku, 'unitCost', parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.subtotal.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.sku)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">請從左側新增商品到採購單中。</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-4 pt-6">
              <div className="text-2xl font-bold">
                採購總金額: <span className="text-primary">NT$ {totalAmount.toLocaleString()}</span>
              </div>
              <Button size="lg" onClick={handleSaveOrder} disabled={isSaving}>
                {isSaving ? "儲存中..." : "建立採購單"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
