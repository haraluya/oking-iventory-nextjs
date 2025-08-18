// src/components/CustomerForm.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { upsertCustomer } from '@/lib/customerApi';
import type { Customer } from '@/types/firestore';
import { toast } from 'sonner';

interface CustomerFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  customerToEdit?: (Customer & { id: string }) | null;
}

const initialState: Omit<Customer, 'createdAt' | 'updatedAt' | 'id'> = {
  customerCode: '',
  name: '',
  level: 'retail',
  contactPerson: '',
  phone: '',
  email: '',
  taxId: '',
  isActive: true,
};

export default function CustomerForm({ isOpen, onOpenChange, onSuccess, customerToEdit }: CustomerFormProps) {
  const [customerData, setCustomerData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setCustomerData(customerToEdit);
    } else {
      setCustomerData(initialState);
    }
  }, [customerToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleLevelChange = (value: 'retail' | 'bronze' | 'silver' | 'gold') => {
    setCustomerData(prev => ({ ...prev, level: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await upsertCustomer({ ...customerData, id: customerToEdit?.id });
      toast.success(`客戶 ${customerToEdit ? '更新' : '新增'}成功！`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('操作失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{customerToEdit ? '編輯客戶' : '新增客戶'}</DialogTitle>
          <DialogDescription>請填寫客戶的詳細資料。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerCode" className="text-right">客戶編碼</Label>
              <Input id="customerCode" name="customerCode" value={customerData.customerCode} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">客戶名稱</Label>
              <Input id="name" name="name" value={customerData.name} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">客戶等級</Label>
              <Select value={customerData.level} onValueChange={handleLevelChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="選擇客戶等級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">零售</SelectItem>
                  <SelectItem value="bronze">銅牌</SelectItem>
                  <SelectItem value="silver">銀牌</SelectItem>
                  <SelectItem value="gold">金牌</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxId" className="text-right">統一編號</Label>
              <Input id="taxId" name="taxId" value={customerData.taxId} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPerson" className="text-right">聯絡人</Label>
              <Input id="contactPerson" name="contactPerson" value={customerData.contactPerson} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">聯絡電話</Label>
              <Input id="phone" name="phone" value={customerData.phone} onChange={handleChange} className="col-span-3" />
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
