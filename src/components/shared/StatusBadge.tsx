import { cn } from '@/lib/utils';
import { ORDER_STATUS, PAYMENT_STATUS, type OrderStatus, type PaymentStatus } from '@/lib/marketplace';

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const s = ORDER_STATUS[status];
  return <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', s.className, className)}>{s.label}</span>;
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const s = PAYMENT_STATUS[status];
  return <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', s.className, className)}>{s.label}</span>;
}
