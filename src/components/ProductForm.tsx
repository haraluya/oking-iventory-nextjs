// src/components/ProductForm.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertProduct } from '@/lib/productApi';
import type { Product } from '@/types/firestore';
import { toast } from 'sonner';

// 定義元件接收的 props
interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void; // 新增一個成功後的回呼函式
  productToEdit?: Product | null;
}

// 表單的初始空白狀態
const initialState: Omit<Product, 'createdAt' | 'updatedAt' | 'currentStock' | 'averageCost'> = {
  sku: '',
  brand: '',
  name: '',
  category: '',
  spec: '',
  unit: '個',
  description: '',
  prices: {
    retail: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
  },
  isActive: true,
};

export default function ProductForm({ isOpen, onOpenChange, onSuccess, productToEdit }: ProductFormProps) {
  const [productData, setProductData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  // 如果有傳入 productToEdit (編輯模式)，就用它的資料填滿表單
  useEffect(() => {
    if (productToEdit) {
      setProductData(productToEdit);
    } else {
      setProductData(initialState);
    }
  }, [productToEdit, isOpen]);

  // 處理表單欄位變動
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  // 處理價格欄位變動
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [name]: Number(value) || 0,
      }
    }));
  };

  // 處理表單提交
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 準備要寫入資料庫的資料
      const dataToSave = {
        ...productData,
        // 如果是新增，給予預設庫存與成本
        currentStock: productToEdit?.currentStock ?? 0,
        averageCost: productToEdit?.averageCost ?? 0,
      };
      
      await upsertProduct(dataToSave);
      toast.success(`商品 ${productToEdit ? '更新' : '新增'}成功！`);
      onSuccess(); // 觸發成功回呼 (例如：重新整理列表)
      onOpenChange(false); // 關閉對話框
    } catch (error) {
      console.error(error);
      toast.error('操作失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productToEdit ? '編輯商品' : '新增商品'}</DialogTitle>
          <DialogDescription>
            請填寫商品的詳細資料。SKU 是商品的唯一識別碼，儲存後不可修改。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">SKU</Label>
              <Input id="sku" name="sku" value={productData.sku} onChange={handleChange} className="col-span-3" required disabled={!!productToEdit} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">商品名稱</Label>
              <Input id="name" name="name" value={productData.name} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brand" className="text-right">品牌</Label>
              <Input id="brand" name="brand" value={productData.brand} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="spec" className="text-right">規格</Label>
              <Input id="spec" name="spec" value={productData.spec} onChange={handleChange} className="col-span-3" />
            </div>
            
            <hr className="my-2" />
            <h4 className="text-md font-semibold col-span-4">價格設定</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="retail" className="text-right">零售價</Label>
              <Input id="retail" name="retail" type="number" value={productData.prices.retail} onChange={handlePriceChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bronze" className="text-right">銅牌價</Label>
              <Input id="bronze" name="bronze" type="number" value={productData.prices.bronze} onChange={handlePriceChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="silver" className="text-right">銀牌價</Label>
              <Input id="silver" name="silver" type="number" value={productData.prices.silver} onChange={handlePriceChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gold" className="text-right">金牌價</Label>
              <Input id="gold" name="gold" type="number" value={productData.prices.gold} onChange={handlePriceChange} className="col-span-3" />
            </div>

          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? '儲存中...' : '儲存'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
