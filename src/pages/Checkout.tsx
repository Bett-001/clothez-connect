import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Loader2, MapPin, Smartphone, Store, Truck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { usePublicStores } from '@/hooks/useMarketplace';
import { supabase } from '@/integrations/supabase/client';
import { deliveryFeeFor, formatKES, PLACEHOLDER_IMAGE, type FulfillmentMethod, type PaymentMethod } from '@/lib/marketplace';
import { groupByStore } from '@/lib/cart';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCart();
  const { data: stores, isLoading: storesLoading } = usePublicStores();
  const groups = groupByStore(items);

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', notes: '' });
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>('delivery');
  const [payment, setPayment] = useState<PaymentMethod>('mpesa');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      name: f.name || profile?.full_name || user.user_metadata?.full_name || '',
      phone: f.phone || profile?.phone || '',
      email: f.email || user.email || '',
      address: f.address || profile?.default_address || '',
      city: f.city || profile?.default_city || '',
    }));
  }, [user, profile]);

  const cartStores = useMemo(
    () => groups.map(g => ({ ...g, store: stores?.find(s => s.id === g.storeId) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, stores],
  );

  const closedStores = cartStores.filter(g => !g.store);
  const openStores = cartStores.filter(g => g.store);
  const canDeliver = openStores.every(g => g.store!.offers_delivery);
  const canPickup = openStores.every(g => g.store!.offers_pickup);
  const canMpesa = openStores.every(g => g.store!.mpesa_till || g.store!.mpesa_paybill);
  const canCash = openStores.every(g => g.store!.accepts_cash);

  // Pick a valid default when the stores in the cart don't support the current choice.
  useEffect(() => {
    if (!storesLoading) {
      if (fulfillment === 'delivery' && !canDeliver && canPickup) setFulfillment('pickup');
      if (fulfillment === 'pickup' && !canPickup && canDeliver) setFulfillment('delivery');
      if (payment === 'mpesa' && !canMpesa && canCash) setPayment('cash');
      if (payment === 'cash' && !canCash && canMpesa) setPayment('mpesa');
    }
  }, [storesLoading, canDeliver, canPickup, canMpesa, canCash, fulfillment, payment]);

  if (authLoading) {
    return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!user) return <Navigate to="/auth?redirect=/checkout" replace />;
  if (items.length === 0) return <Navigate to="/cart" replace />;

  const perStore = openStores.map(g => {
    const fee = deliveryFeeFor(g.store!, g.subtotal, fulfillment);
    return { ...g, fee, total: g.subtotal + fee };
  });
  const grandTotal = perStore.reduce((s, g) => s + g.total, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Enter your name';
    if (!/^\+?[\d\s-]{9,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number, for example 0712 345 678';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (fulfillment === 'delivery' && !form.address.trim()) e.address = 'Enter where we should deliver';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    if (closedStores.length) {
      toast.error('Remove items from stores that are no longer open first.');
      return;
    }
    setPlacing(true);
    const { data, error } = await supabase.rpc('place_orders', {
      _items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, size: i.size, color: i.color })),
      _customer_name: form.name.trim(),
      _customer_phone: form.phone.trim(),
      _customer_email: form.email.trim(),
      _fulfillment_method: fulfillment,
      _delivery_address: form.address.trim(),
      _delivery_city: form.city.trim(),
      _notes: form.notes.trim(),
      _payment_method: payment,
    });
    setPlacing(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    const orders = data ?? [];
    clearCart();
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    toast.success(orders.length > 1 ? `${orders.length} orders placed!` : 'Order placed!');
    navigate(orders.length === 1 ? `/orders/${orders[0].id}?placed=1` : '/orders?placed=1');
  };

  const field = (key: keyof typeof form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div>
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className={cn('mt-1', errors[key] && 'border-destructive')}
        {...props}
      />
      {errors[key] && <p className="text-destructive text-sm mt-1">{errors[key]}</p>}
    </div>
  );

  const option = (active: boolean, disabled: boolean) =>
    cn(
      'flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors',
      active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      disabled && 'opacity-40 pointer-events-none',
    );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />Back to cart
        </Link>
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            <section className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Your details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {field('name', 'Full name', { autoComplete: 'name' })}
                {field('phone', 'Phone number', { placeholder: '0712 345 678', autoComplete: 'tel', inputMode: 'tel' })}
              </div>
              {field('email', 'Email (for order updates)', { type: 'email', autoComplete: 'email' })}
            </section>

            <section className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">How do you want to get your order?</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setFulfillment('delivery')} className={option(fulfillment === 'delivery', !canDeliver)}>
                  <Truck className="w-5 h-5 text-primary mt-0.5" />
                  <div><p className="font-medium">Delivery</p><p className="text-xs text-muted-foreground">The store delivers to your address</p></div>
                </button>
                <button type="button" onClick={() => setFulfillment('pickup')} className={option(fulfillment === 'pickup', !canPickup)}>
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div><p className="font-medium">Pickup</p><p className="text-xs text-muted-foreground">Collect from the shop for free</p></div>
                </button>
              </div>
              {(!canDeliver || !canPickup) && (
                <p className="text-xs text-muted-foreground">
                  Some stores in your cart only offer {canDeliver ? 'delivery' : 'pickup'}.
                </p>
              )}
              {fulfillment === 'delivery' && (
                <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
                  {field('address', 'Delivery address', { placeholder: 'Building, street, area', autoComplete: 'street-address' })}
                  {field('city', 'Town', { placeholder: 'Nairobi', autoComplete: 'address-level2' })}
                </div>
              )}
              {fulfillment === 'pickup' && (
                <div className="space-y-2 text-sm">
                  {openStores.map(g => (
                    <p key={g.storeId} className="text-muted-foreground">
                      <span className="text-foreground font-medium">{g.storeName}:</span>{' '}
                      {[g.store!.address, g.store!.location, g.store!.city].filter(Boolean).join(', ') || 'Address shared by the store after confirmation'}
                    </p>
                  ))}
                </div>
              )}
              <div>
                <Label htmlFor="notes">Notes for the store (optional)</Label>
                <Textarea id="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Landmarks, gate code, preferred delivery time..." className="mt-1" maxLength={500} />
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Payment</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setPayment('mpesa')} className={option(payment === 'mpesa', !canMpesa)}>
                  <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                  <div><p className="font-medium">M-Pesa</p><p className="text-xs text-muted-foreground">Pay to the store's till or paybill, then enter the confirmation code</p></div>
                </button>
                <button type="button" onClick={() => setPayment('cash')} className={option(payment === 'cash', !canCash)}>
                  <Banknote className="w-5 h-5 text-primary mt-0.5" />
                  <div><p className="font-medium">Cash</p><p className="text-xs text-muted-foreground">Pay when you receive or collect your order</p></div>
                </button>
              </div>
              {(!canMpesa || !canCash) && (
                <p className="text-xs text-muted-foreground">Some stores in your cart only accept {canMpesa ? 'M-Pesa' : 'cash'}.</p>
              )}
            </section>
          </div>

          <aside className="bg-card rounded-xl border border-border p-6 h-fit lg:sticky lg:top-24 space-y-5">
            <h2 className="font-display text-xl font-bold">Order Summary</h2>
            {closedStores.length > 0 && (
              <p className="text-sm text-destructive">
                {closedStores.map(g => g.storeName).join(', ')} is no longer open. Remove those items from your cart to continue.
              </p>
            )}
            {perStore.map(g => (
              <div key={g.storeId} className="space-y-2 pb-4 border-b border-border">
                <p className="font-medium flex items-center gap-2"><Store className="w-4 h-4 text-primary" />{g.storeName}</p>
                {g.items.map(i => (
                  <div key={`${i.product.id}-${i.size}-${i.color}`} className="flex gap-3 text-sm">
                    <img src={i.product.image ?? PLACEHOLDER_IMAGE} alt="" className="w-10 h-12 rounded object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">{[i.size, i.color].filter(Boolean).join(' · ')} × {i.quantity}</p>
                    </div>
                    <span>{formatKES(i.product.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery</span><span>{g.fee ? formatKES(g.fee) : 'Free'}</span></div>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatKES(grandTotal)}</span>
            </div>
            <Button variant="gold" size="lg" className="w-full" onClick={placeOrder} disabled={placing || storesLoading}>
              {placing ? <><Loader2 className="w-4 h-4 animate-spin" />Placing order...</> : `Place order · ${formatKES(grandTotal)}`}
            </Button>
            {perStore.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">You'll get one order per store, each paid to that store.</p>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}
