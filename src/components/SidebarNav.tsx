// src/components/SidebarNav.tsx
'use client';

import Link from 'next/link';
import {
  Home,
  Package,
  Users,
  Building,
  Warehouse,
  ShoppingCart,
  Truck,
  LineChart,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: '智慧儀表板', icon: Home },
  { href: '/products', label: '商品管理', icon: Package },
  { href: '/customers', label: '客戶管理', icon: Users },
  { href: '/suppliers', label: '供應商管理', icon: Building },
  { href: '/inventory', label: '庫存管理', icon: Warehouse },
  { href: '/sales', label: '銷貨流程', icon: ShoppingCart },
  { href: '/purchases', label: '進貨流程', icon: Truck },
  { href: '/reports', label: '報表與結算', icon: LineChart },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            { 'bg-muted text-primary': pathname === href }
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
