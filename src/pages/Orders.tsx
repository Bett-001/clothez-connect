import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Package, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDate, formatKES, PLACEHOLDER_IMAGE, type OrderItemRow, type OrderRow } from '@/lib/marketplace';

type OrderListRow = OrderRow & { stores: { name: string } | null; order_items: Pick<OrderItemRow, 'product_image' | 'product_name' | 'quantity'>[] };

export default function Orders() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const justPlaced = params.get('placed');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, stores(name), order_items(product_image, product_name, quantity)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrderListRow[];
    },
    enabled: !!user,
  });

  if (loading) return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  if (!user) return <Navigate to="/auth?redirect=/orders" replace />;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground mb-8">Track your purchases from every store</p>

        {justPlaced && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm">Your orders were placed. Open each one to see payment instructions and track progress.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !orders?.length ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Package className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">When you buy something, it will show up here.</p>
            <Link to="/stores"><Button variant="gold">Start shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const count = order.order_items.reduce((s, i) => s + i.quantity, 0);
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex gap-4 items-center p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex -space-x-3 shrink-0">
                    {order.order_items.slice(0, 3).map((i, idx) => (
                      <img key={idx} src={i.product_image ?? PLACEHOLDER_IMAGE} alt="" className="w-12 h-14 rounded-lg object-cover border-2 border-card bg-muted" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold">{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                      {order.status !== 'cancelled' && <PaymentStatusBadge status={order.payment_status} />}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {order.stores?.name ?? 'Store'} · {count} {count === 1 ? 'item' : 'items'} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className="font-bold text-primary whitespace-nowrap">{formatKES(order.total)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
