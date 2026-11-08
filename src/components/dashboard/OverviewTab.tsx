import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Clock, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderStatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatKES, type StoreRow } from '@/lib/marketplace';
import { useStoreOrders } from './OrdersTab';

export function OverviewTab({ store, onOpenTab }: { store: StoreRow; onOpenTab: (tab: string) => void }) {
  const { data: orders } = useStoreOrders(store.id);
  const { data: lowStock } = useQuery({
    queryKey: ['owner-low-stock', store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .lte('stock', 3)
        .order('stock');
      if (error) throw error;
      return data;
    },
  });

  const all = orders ?? [];
  const live = all.filter(o => o.status !== 'cancelled');
  const revenue = live.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total), 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthRevenue = live
    .filter(o => o.payment_status === 'paid' && new Date(o.created_at) >= startOfMonth)
    .reduce((s, o) => s + Number(o.total), 0);
  const newOrders = all.filter(o => o.status === 'pending').length;
  const toVerify = all.filter(o => o.payment_status === 'pending_verification' && o.status !== 'cancelled').length;

  const stats = [
    { label: 'New orders', value: newOrders.toString(), icon: ShoppingCart, tab: 'orders' },
    { label: 'Payments to verify', value: toVerify.toString(), icon: Clock, tab: 'orders' },
    { label: 'Paid this month', value: formatKES(monthRevenue), icon: Banknote },
    { label: 'Paid all time', value: formatKES(revenue), icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <button
            key={s.label}
            onClick={() => s.tab && onOpenTab(s.tab)}
            className="bg-card p-5 rounded-xl border border-border text-left hover:border-primary/40 transition-colors"
          >
            <s.icon className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Recent orders</h3>
          {all.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. Share your store link to get your first sale.</p>
          ) : (
            <div className="space-y-3">
              {all.slice(0, 6).map(o => (
                <button key={o.id} onClick={() => onOpenTab('orders')} className="w-full flex items-center gap-3 text-sm text-left hover:text-primary">
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{o.order_number}</span>
                    <span className="text-muted-foreground"> · {o.customer_name} · {formatDate(o.created_at)}</span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                  <span className="font-medium w-24 text-right">{formatKES(o.total)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" />Running low</h3>
          {!lowStock?.length ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" />All visible products have more than 3 in stock.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map(p => (
                <button key={p.id} onClick={() => onOpenTab('products')} className="w-full flex justify-between text-sm hover:text-primary">
                  <span className="line-clamp-1">{p.name}</span>
                  <span className={p.stock === 0 ? 'text-destructive' : 'text-primary'}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
