import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader2, MapPin, Phone, Package, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
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
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/marketplace';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type StoreOrder = OrderRow & { order_items: OrderItemRow[] };

export function useStoreOrders(storeId: string) {
  return useQuery({
    queryKey: ['store-orders', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StoreOrder[];
    },
    enabled: !!storeId,
    refetchInterval: 30_000,
  });
}

const FILTERS: { id: 'active' | OrderStatus | 'all'; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'New' },
  { id: 'delivered', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

function nextStatus(order: StoreOrder): { status: OrderStatus; label: string } | null {
  const i = ORDER_STATUS_FLOW.indexOf(order.status);
  if (i < 0 || i === ORDER_STATUS_FLOW.length - 1) return null;
  const status = ORDER_STATUS_FLOW[i + 1];
  const labels: Partial<Record<OrderStatus, string>> = {
    confirmed: 'Confirm order',
    processing: 'Start preparing',
    shipped: order.fulfillment_method === 'pickup' ? 'Mark ready for pickup' : 'Mark out for delivery',
    delivered: order.fulfillment_method === 'pickup' ? 'Mark collected' : 'Mark delivered',
  };
  return { status, label: labels[status] ?? ORDER_STATUS[status].label };
}

function OrderCard({ order, storeId }: { order: StoreOrder; storeId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(order.status === 'pending');
  const [note, setNote] = useState(order.store_notes ?? '');

  const update = useMutation({
    mutationFn: async (patch: Partial<Pick<OrderRow, 'status' | 'payment_status' | 'store_notes'>>) => {
      const { error } = await supabase.from('orders').update(patch).eq('id', order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-orders', storeId] });
      queryClient.invalidateQueries({ queryKey: ['owner-products', storeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const next = nextStatus(order);
  const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0);
  const setPayment = (payment_status: PaymentStatus, msg: string) =>
    update.mutate({ payment_status }, { onSuccess: () => toast.success(msg) });

  return (
    <div className="bg-card rounded-xl border border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex flex-wrap items-center gap-3 p-4 text-left">
        <div className="flex-1 min-w-[180px]">
          <p className="font-semibold">{order.order_number} · {order.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · {order.fulfillment_method === 'delivery' ? 'Delivery' : 'Pickup'} · {formatDate(order.created_at, true)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
        {order.status !== 'cancelled' && <PaymentStatusBadge status={order.payment_status} />}
        <span className="font-bold text-primary">{formatKES(order.total)}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-border p-4 grid md:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-3">
            {order.order_items.map(item => (
              <div key={item.id} className="flex gap-3 text-sm">
                <img src={item.product_image ?? PLACEHOLDER_IMAGE} alt="" className="w-12 h-14 rounded object-cover bg-muted" />
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-muted-foreground">{[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')} × {item.quantity}</p>
                </div>
                <span>{formatKES(item.line_total)}</span>
              </div>
            ))}
            <div className="text-sm border-t border-border pt-3 space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKES(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatKES(order.delivery_fee)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatKES(order.total)}</span></div>
            </div>
            {order.notes && <p className="text-sm bg-secondary/50 p-3 rounded-lg"><span className="font-medium">Customer note:</span> {order.notes}</p>}
          </div>

          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /><a href={`tel:${order.customer_phone}`} className="hover:text-primary">{order.customer_phone}</a></p>
              <a href={whatsappLink(order.customer_phone, `Hi ${order.customer_name}, about your Clotz Hub order ${order.order_number}:`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                <MessageCircle className="w-4 h-4" />WhatsApp customer
              </a>
              {order.fulfillment_method === 'delivery' && (
                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5" />{[order.delivery_address, order.delivery_city].filter(Boolean).join(', ')}</p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
              <p><span className="text-muted-foreground">Payment:</span> {PAYMENT_METHOD_LABEL[order.payment_method]}</p>
              {order.payment_reference && <p><span className="text-muted-foreground">M-Pesa code:</span> <span className="font-mono font-semibold">{order.payment_reference}</span></p>}
              {order.status !== 'cancelled' && order.payment_status !== 'paid' && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPayment('paid', 'Marked as paid')} disabled={update.isPending}>Mark paid</Button>
                  {order.payment_status === 'pending_verification' && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setPayment('failed', 'Customer asked to resend code')} disabled={update.isPending}>
                      Code not found
                    </Button>
                  )}
                </div>
              )}
              {order.payment_status === 'paid' && order.status === 'cancelled' && (
                <Button size="sm" variant="outline" onClick={() => setPayment('refunded', 'Marked as refunded')}>Mark refunded</Button>
              )}
            </div>

            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <div className="space-y-2">
                {next && (
                  <Button variant="gold" className="w-full" onClick={() => update.mutate({ status: next.status })} disabled={update.isPending}>
                    {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : next.label}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={update.isPending}
                  onClick={() => confirm('Cancel this order? Items go back into stock.') && update.mutate({ status: 'cancelled' })}
                >
                  Cancel order
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Message to the customer (shown on their order)" rows={2} maxLength={500} />
              {note !== (order.store_notes ?? '') && (
                <Button size="sm" variant="outline" onClick={() => update.mutate({ store_notes: note.trim() || null }, { onSuccess: () => toast.success('Message saved') })}>
                  Save message
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrdersTab({ storeId }: { storeId: string }) {
  const { data: orders, isLoading } = useStoreOrders(storeId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('active');

  const filtered = (orders ?? []).filter(o =>
    filter === 'all' ? true : filter === 'active' ? !['delivered', 'cancelled'].includes(o.status) : o.status === filter,
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const count = (orders ?? []).filter(o =>
            f.id === 'all' ? true : f.id === 'active' ? !['delivered', 'cancelled'].includes(o.status) : o.status === f.id,
          ).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No orders here yet.</p>
        </div>
      ) : (
        filtered.map(o => <OrderCard key={o.id} order={o} storeId={storeId} />)
      )}
    </div>
  );
}
