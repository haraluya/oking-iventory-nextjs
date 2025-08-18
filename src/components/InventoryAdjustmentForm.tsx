// src/components/InventoryAdjustmentForm.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adjustStock } from '@/lib/productApi';
import type { Product } from '@/types/firestore';
import { toast } from 'sonner';

interface InventoryAdjustmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  productToAdjust?: (Product & { id: string }) | null;
}

export default function InventoryAdjustmentForm({ isOpen, onOpenChange, onSuccess, productToAdjust }: InventoryAdjustmentFormProps) {
  const [newStock, setNewStock] = useState<number | string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productToAdjust) {
      setNewStock(productToAdjust.currentStock);
      setNote(''); // 每次打開都清空備註
    }
  }, [productToAdjust, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productToAdjust || newStock === '' || Number(newStock) < 0) {
      toast.error('請輸入有效的庫存數量。');
      return;
    }
    setLoading(true);

    try {
      await adjustStock(productToAdjust.id, Number(newStock), note || '手動盤點調整');
      toast.success(`商品 ${productToAdjust.name} 庫存已更新！`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('庫存更新失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  if (!productToAdjust) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>庫存調整</DialogTitle>
          <DialogDescription>
            調整商品 <span className="font-bold text-primary">{productToAdjust.name}</span> 的庫存數量。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">SKU</Label>
              <Input value={productToAdjust.sku} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">目前庫存</Label>
              <Input value={productToAdjust.currentStock} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newStock" className="text-right">新庫存數量</Label>
              <Input
                id="newStock"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">備註</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：每月盤點、損壞報廢..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? '儲存中...' : '確認調整'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
