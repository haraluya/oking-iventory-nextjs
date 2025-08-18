// src/app/sales/new/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// --- 修正路徑開始 ---
// 將 @/components/... 修改為相對路徑
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
// --- 修正路徑結束 ---
import { ChevronsUpDown, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// --- 修正路徑開始 ---
// 引入 Firebase auth 和後端 API (使用相對路徑)
import { auth } from '../../../lib/firebase';
import { getAllCustomers } from '../../../lib/customerApi';
import { getAllProducts } from '../../../lib/productApi';
import { upsertSalesOrder } from '../../../lib/salesOrderApi'; // 引入儲存函式

// 從 firestore.d.ts 引入類型 (使用相對路徑)
import type { Customer, Product, SalesOrder, SalesOrderItem } from '../../../types/firestore';
// --- 修正路徑結束 ---


type CustomerWithId = Customer & { id: string };
type ProductWithId = Product & { id: string };

// 產生訂單號碼的輔助函式
const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SO-${year}${month}${day}-${randomPart}`;
};


export default function NewSalesOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithId[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithId | null>(null);
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Popover 開關狀態
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [customersData, productsData] = await Promise.all([
          getAllCustomers(),
          getAllProducts(),
        ]);
        setCustomers(customersData as CustomerWithId[]);
        setProducts(productsData);
      } catch (error) {
        console.error("讀取基礎資料失敗:", error);
        toast.error("讀取客戶或商品資料失敗。");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectCustomer = (customer: CustomerWithId) => {
    setSelectedCustomer(customer);
    setCustomerPopoverOpen(false);
    setOrderItems([]); 
    toast.info(`已選擇客戶: ${customer.name} (${customer.level} 等級)`);
  };

  const handleAddProduct = (product: ProductWithId) => {
    if (!selectedCustomer) {
      toast.warning("請先選擇一位客戶。");
      return;
    }

    if (orderItems.some(item => item.sku === product.sku)) {
      toast.info(`商品 ${product.name} 已在訂單中，請直接修改數量。`);
      return;
    }

    const priceLevel = selectedCustomer.level;
    const unitPrice = product.prices[priceLevel] || product.prices.retail;

    const newItem: SalesOrderItem = {
      sku: product.sku,
      name: product.name,
      spec: product.spec,
      quantity: 1,
      unitPrice: unitPrice,
      subtotal: unitPrice,
    };

    setOrderItems([...orderItems, newItem]);
    setProductPopoverOpen(false);
  };

  const handleQuantityChange = (sku: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity);
    setOrderItems(orderItems.map(item =>
      item.sku === sku
        ? { ...item, quantity: newQuantity, subtotal: item.unitPrice * newQuantity }
        : item
    ));
  };

  const handleRemoveItem = (sku: string) => {
    setOrderItems(orderItems.filter(item => item.sku !== sku));
  };

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [orderItems]);

  const handleSaveOrder = async () => {
    if (!selectedCustomer) {
      toast.error("未選擇客戶。");
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
      // 根據 firestore.d.ts 的 SalesOrder 結構來建立物件
      const newOrder: Omit<SalesOrder, 'createdAt' | 'updatedAt' | 'id' | 'createdBy'> = {
        orderNumber: generateOrderNumber(),
        customerId: selectedCustomer.id,
        customerInfo: { 
            name: selectedCustomer.name, 
            level: selectedCustomer.level,
            taxId: selectedCustomer.taxId || '',
        },
        // 注意：這裡的地址應該讓使用者可以編輯，目前先帶入客戶預設地址
        shippingAddress: selectedCustomer.address || { zipCode: '', city: '', district: '', street: '' },
        items: orderItems,
        totalAmount: totalAmount,
        status: 'pending-approval', // 初始狀態
        paymentStatus: 'unpaid', // 初始付款狀態
      };
      
      await upsertSalesOrder(newOrder); 
      
      toast.success("銷售單已成功建立！初始狀態為「待批准」。");
      router.push('/sales'); 
    } catch (error) {
      console.error("儲存銷售單失敗:", error);
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
        <h1 className="text-3xl font-bold">建立銷售單</h1>
        <Button onClick={() => router.back()}>返回列表</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側客戶與商品區 */}
        <div className="lg-col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. 選擇客戶</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerPopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? selectedCustomer.name : "選擇一位客戶..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="搜尋客戶名稱..." />
                    <CommandList>
                      <CommandEmpty>找不到客戶。</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => handleSelectCustomer(customer)}
                          >
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedCustomer && (
                <div className="mt-4 text-sm text-muted-foreground p-3 bg-slate-50 rounded-md">
                  <p>客戶編號: {selectedCustomer.customerCode}</p>
                  <p>客戶等級: <span className="font-bold text-primary">{selectedCustomer.level}</span></p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. 新增商品</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productPopoverOpen}
                    className="w-full justify-between"
                    disabled={!selectedCustomer}
                  >
                    新增商品至訂單...
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
                          <CommandItem
                            key={product.id}
                            value={`${product.sku} ${product.name}`}
                            onSelect={() => handleAddProduct(product)}
                          >
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

        {/* 右側訂單明細 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>3. 訂單明細</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">SKU</TableHead>
                      <TableHead>商品名稱</TableHead>
                      <TableHead className="text-right">單價</TableHead>
                      <TableHead className="w-[120px] text-center">數量</TableHead>
                      <TableHead className="text-right">小計</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.length > 0 ? (
                      orderItems.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              className="text-center"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.sku, parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.subtotal.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.sku)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          請從左側新增商品到訂單中。
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-4 pt-6">
              <div className="text-2xl font-bold">
                訂單總金額: <span className="text-primary">NT$ {totalAmount.toLocaleString()}</span>
              </div>
              <Button size="lg" onClick={handleSaveOrder} disabled={isSaving}>
                {isSaving ? "儲存中..." : "建立訂單"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
