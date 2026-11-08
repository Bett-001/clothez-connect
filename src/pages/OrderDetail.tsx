import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckCircle2, Loader2, MapPin, MessageCircle, Smartphone, Store, Banknote } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicStore } from '@/hooks/useMarketplace';
import { supabase } from '@/integrations/supabase/client';
import {
  formatDate,
  formatKES,
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
  PAYMENT_METHOD_LABEL,
  PLACEHOLDER_IMAGE,
  whatsappLink,
  type OrderItemRow,
  type OrderRow,
} from '@/lib/marketplace';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type OrderWithItems = OrderRow & { order_items: OrderItemRow[]; stores: { name: string } | null };

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), stores(name)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as OrderWithItems | null;
    },
    enabled: !!user && !!id,
    refetchInterval: 30_000,
  });
  const { data: store } = usePublicStore(order?.store_id);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] });
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
  };

  const submitCode = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('submit_payment_reference', { _order_id: id!, _reference: code });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payment code sent. The store will confirm it shortly.');
      setCode('');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cancel_order', { _order_id: id! });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order cancelled');
      refresh();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  if (!user) return <Navigate to={`/auth?redirect=/orders/${id}`} replace />;
  if (isLoading) return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  if (!order) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <Link to="/orders" className="text-primary hover:underline mt-4 block">Back to my orders</Link>
        </div>
      </Layout>
    );
  }

  const isCustomer = order.customer_id === user.id;
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const needsMpesa =
    isCustomer && order.payment_method === 'mpesa' && ['unpaid', 'failed'].includes(order.payment_status) && order.status !== 'cancelled';
  const storeName = order.stores?.name ?? store?.name ?? 'the store';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />My orders
        </Link>

        {params.get('placed') && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Thank you! Your order has been sent to {storeName}.</p>
              {needsMpesa && <p className="text-muted-foreground">Complete your M-Pesa payment below so the store can confirm it.</p>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Order {order.order_number}</h1>
            <p className="text-muted-foreground text-sm">Placed {formatDate(order.created_at, true)}</p>
          </div>
          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            {order.status !== 'cancelled' && <PaymentStatusBadge status={order.payment_status} />}
          </div>
        </div>

        {order.status !== 'cancelled' && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex justify-between">
              {ORDER_STATUS_FLOW.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center text-center relative">
                  {i > 0 && <div className={cn('absolute top-4 right-1/2 w-full h-0.5', i <= stepIndex ? 'bg-primary' : 'bg-border')} />}
                  <div className={cn('relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', i <= stepIndex ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                    {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={cn('text-[11px] sm:text-xs mt-2', i <= stepIndex ? 'text-foreground' : 'text-muted-foreground')}>
                    {s === 'shipped' && order.fulfillment_method === 'pickup' ? 'Ready for pickup' : ORDER_STATUS[s].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {needsMpesa && (
          <div className="bg-primary/5 border-2 border-primary/40 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary" />Pay with M-Pesa</h2>
            {store && (store.mpesa_till || store.mpesa_paybill) ? (
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Open M-Pesa and choose <span className="text-foreground font-medium">{store.mpesa_till ? 'Buy Goods and Services' : 'Pay Bill'}</span>.</li>
                {store.mpesa_till ? (
                  <li>Enter till number <span className="text-foreground font-bold">{store.mpesa_till}</span>.</li>
                ) : (
                  <>
                    <li>Enter business number <span className="text-foreground font-bold">{store.mpesa_paybill}</span>.</li>
                    <li>Enter account number <span className="text-foreground font-bold">{store.mpesa_account || order.order_number}</span>.</li>
                  </>
                )}
                <li>Pay exactly <span className="text-foreground font-bold">{formatKES(order.total)}</span> to {storeName}.</li>
                <li>Type the confirmation code from the M-Pesa SMS below.</li>
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Contact {storeName} for their M-Pesa details.</p>
            )}
            <form
              onSubmit={e => {
                e.preventDefault();
                submitCode.mutate();
              }}
              className="flex gap-2"
            >
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SJK4H7XYZ2" maxLength={20} className="uppercase" />
              <Button type="submit" variant="gold" disabled={!code.trim() || submitCode.isPending}>
                {submitCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit code'}
              </Button>
            </form>
            {order.payment_status === 'failed' && (
              <p className="text-sm text-destructive">The store could not verify your last code. Please check it and try again.</p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Items</h2>
            <div className="space-y-4">
              {order.order_items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.product_image ?? PLACEHOLDER_IMAGE} alt="" className="w-16 h-20 rounded-lg object-cover bg-muted" />
                  <div className="flex-1 min-w-0">
                    {item.product_id ? (
                      <Link to={`/product/${item.product_id}`} className="font-medium hover:text-primary line-clamp-1">{item.product_name}</Link>
                    ) : (
                      <p className="font-medium line-clamp-1">{item.product_name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatKES(item.unit_price)} × {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatKES(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-6 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKES(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{Number(order.delivery_fee) ? formatKES(order.delivery_fee) : 'Free'}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2"><span>Total</span><span className="text-primary">{formatKES(order.total)}</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 text-sm space-y-3">
              <Link to={`/store/${order.store_id}`} className="flex items-center gap-2 font-semibold hover:text-primary">
                <Store className="w-4 h-4 text-primary" />{storeName}
              </Link>
              {store?.whatsapp && (
                <a href={whatsappLink(store.whatsapp, `Hi, I'm asking about order ${order.order_number}.`)} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full"><MessageCircle className="w-4 h-4" />Message store</Button>
                </a>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-sm space-y-2">
              <p className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{order.fulfillment_method === 'delivery' ? 'Delivery' : 'Pickup'}</p>
              <p>{order.customer_name} · {order.customer_phone}</p>
              {order.fulfillment_method === 'delivery' ? (
                <p className="text-muted-foreground">{[order.delivery_address, order.delivery_city].filter(Boolean).join(', ')}</p>
              ) : (
                <p className="text-muted-foreground">{store ? [store.address, store.location, store.city].filter(Boolean).join(', ') : 'Collect from the store'}</p>
              )}
              {order.notes && <p className="text-muted-foreground italic">"{order.notes}"</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-sm space-y-2">
              <p className="font-semibold flex items-center gap-2">
                {order.payment_method === 'mpesa' ? <Smartphone className="w-4 h-4 text-primary" /> : <Banknote className="w-4 h-4 text-primary" />}
                {PAYMENT_METHOD_LABEL[order.payment_method]}
              </p>
              {order.payment_reference && <p className="text-muted-foreground">Code: <span className="text-foreground font-mono">{order.payment_reference}</span></p>}
            </div>
            {order.store_notes && (
              <div className="bg-card border border-border rounded-xl p-5 text-sm">
                <p className="font-semibold mb-1">Message from the store</p>
                <p className="text-muted-foreground">{order.store_notes}</p>
              </div>
            )}
            {isCustomer && order.status === 'pending' && order.payment_status !== 'paid' && (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                disabled={cancel.isPending}
                onClick={() => confirm('Cancel this order?') && cancel.mutate()}
              >
                Cancel order
              </Button>
            )}
            {isCustomer && order.status === 'delivered' && (
              <Link to={`/store/${order.store_id}`}>
                <Button variant="gold" className="w-full">Rate this store</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
