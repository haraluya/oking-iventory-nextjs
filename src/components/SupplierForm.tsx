// src/components/SupplierForm.tsx
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
import { upsertSupplier } from '@/lib/supplierApi';
import type { Supplier } from '@/types/firestore';
import { toast } from 'sonner';

// 定義此元件接收的 props 型別
interface SupplierFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void; // 操作成功後的回呼函式 (用於刷新列表)
  supplierToEdit?: (Supplier & { id: string }) | null; // 要編輯的供應商資料
}

// 表單的初始空白狀態
const initialState: Omit<Supplier, 'createdAt' | 'updatedAt' | 'id'> = {
  supplierCode: '',
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  taxId: '',
  paymentTerms: '',
  notes: '',
  isActive: true,
};

export default function SupplierForm({ isOpen, onOpenChange, onSuccess, supplierToEdit }: SupplierFormProps) {
  // 使用 state 管理表單資料
  const [supplierData, setSupplierData] = useState(initialState);
  // 使用 state 管理載入狀態，防止重複提交
  const [loading, setLoading] = useState(false);

  // 當 supplierToEdit 或 isOpen 狀態改變時觸發
  useEffect(() => {
    if (supplierToEdit) {
      // 如果有傳入 supplierToEdit (編輯模式)，就用它的資料填滿表單
      setSupplierData(supplierToEdit);
    } else {
      // 否則 (新增模式)，就重設為初始空白狀態
      setSupplierData(initialState);
    }
  }, [supplierToEdit, isOpen]);

  // 處理一般輸入框的變動
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSupplierData(prev => ({ ...prev, [name]: value }));
  };

  // 處理表單提交事件
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // 防止頁面重新整理
    setLoading(true);

    try {
      // 呼叫 API 函式，將表單資料 (包含可能的 id) 傳入
      await upsertSupplier({ ...supplierData, id: supplierToEdit?.id });
      // 顯示成功訊息
      toast.success(`供應商 ${supplierToEdit ? '更新' : '新增'}成功！`);
      onSuccess(); // 觸發成功回呼，通知父元件刷新列表
      onOpenChange(false); // 關閉對話框
    } catch (error) {
      console.error(error);
      toast.error('操作失敗，請稍後再試。');
    } finally {
      setLoading(false); // 無論成功或失敗，都要結束載入狀態
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{supplierToEdit ? '編輯供應商' : '新增供應商'}</DialogTitle>
          <DialogDescription>請填寫供應商的詳細資料。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierCode" className="text-right">供應商編碼</Label>
              <Input id="supplierCode" name="supplierCode" value={supplierData.supplierCode} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">供應商名稱</Label>
              <Input id="name" name="name" value={supplierData.name} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxId" className="text-right">統一編號</Label>
              <Input id="taxId" name="taxId" value={supplierData.taxId} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPerson" className="text-right">聯絡人</Label>
              <Input id="contactPerson" name="contactPerson" value={supplierData.contactPerson} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">聯絡電話</Label>
              <Input id="phone" name="phone" value={supplierData.phone} onChange={handleChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">電子郵件</Label>
              <Input id="email" name="email" type="email" value={supplierData.email} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? '儲存中...' : '儲存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
