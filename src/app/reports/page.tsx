// src/app/reports/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore'; // --- 新增引入 Timestamp ---

import { getFinancialSummary } from '@/lib/reportsApi';
import type { SalesOrder } from '@/types/firestore';

interface FinancialSummaryData {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  orderCount: number;
  orders: (SalesOrder & { id: string })[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
};

export default function FinancialReportPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to) {
      toast.error("請選擇完整的日期區間。");
      return;
    }
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await getFinancialSummary(date.from, date.to);
      setSummary(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "報表生成失敗。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold">財務業績分析</h1>
            <p className="text-muted-foreground">分析指定期間內的銷售、成本與毛利狀況。</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[300px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>選擇日期</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            生成報表
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-center py-10">報表生成中，請稍候...</div>}

      {summary && (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader><CardTitle>總銷售額</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>總銷售成本</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>毛利</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(summary.grossProfit)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>毛利率</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{summary.grossMargin.toFixed(2)}%</p></CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>已完成訂單明細</CardTitle>
                    <CardDescription>共 {summary.orderCount} 筆已完成訂單</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>出貨日期</TableHead>
                                    <TableHead>訂單號碼</TableHead>
                                    <TableHead>客戶</TableHead>
                                    <TableHead className="text-right">銷售額</TableHead>
                                    <TableHead className="text-right">成本</TableHead>
                                    <TableHead className="text-right">毛利</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.orders.length > 0 ? summary.orders.map(order => (
                                    <TableRow key={order.id}>
                                        {/* --- 修正開始 --- */}
                                        <TableCell>
                                            {order.shippedAt && order.shippedAt instanceof Timestamp 
                                                ? format(order.shippedAt.toDate(), 'yyyy/MM/dd') 
                                                : 'N/A'}
                                        </TableCell>
                                        {/* --- 修正結束 --- */}
                                        <TableCell>{order.orderNumber}</TableCell>
                                        <TableCell>{order.customerInfo.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.totalCost || 0)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.grossProfit || 0)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">此區間內沒有已完成的訂單。</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
