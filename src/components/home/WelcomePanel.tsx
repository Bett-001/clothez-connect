import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, ShieldCheck, ShoppingBag, Store, type LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';

const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'] as const;

interface Tile {
  to: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  highlight?: boolean;
}

/** Shown at the top of the home page for signed-in people: their shortcuts and what needs attention. */
export function WelcomePanel() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { isAdmin } = useUserRole();

  const { data: activeOrders = 0 } = useQuery({
    queryKey: ['welcome-active-orders', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', user!.id)
        .in('status', [...ACTIVE_ORDER_STATUSES]);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: myStores = [] } = useQuery({
    queryKey: ['welcome-my-stores', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('stores').select('id, name, status').eq('owner_id', user!.id).order('created_at');
      return data ?? [];
    },
    enabled: !!user,
  });

  const approvedStoreIds = myStores.filter(s => s.status === 'approved').map(s => s.id);
  const { data: newStoreOrders = 0 } = useQuery({
    queryKey: ['welcome-store-orders', approvedStoreIds.join(',')],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('store_id', approvedStoreIds)
        .eq('status', 'pending');
      return count ?? 0;
    },
    enabled: approvedStoreIds.length > 0,
  });

  const { data: pendingStores = 0 } = useQuery({
    queryKey: ['welcome-pending-stores'],
    queryFn: async () => {
      const { count } = await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      return count ?? 0;
    },
    enabled: isAdmin,
  });

  if (!user) return null;

  const firstName = (user.user_metadata?.full_name as string | undefined)?.trim().split(' ')[0];
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const tiles: Tile[] = [
    {
      to: '/orders',
      icon: Package,
      title: 'My orders',
      detail: activeOrders > 0 ? `${plural(activeOrders, 'order')} on the way` : 'Track and review your orders',
      highlight: activeOrders > 0,
    },
    {
      to: itemCount > 0 ? '/cart' : '/stores',
      icon: ShoppingBag,
      title: itemCount > 0 ? 'Your cart' : 'Start shopping',
      detail: itemCount > 0 ? `${plural(itemCount, 'item')} waiting for checkout` : 'Browse stores for men, women and kids',
      highlight: itemCount > 0,
    },
  ];

  if (myStores.length > 0) {
    const store = myStores[0];
    tiles.push({
      to: '/my-store',
      icon: Store,
      title: myStores.length > 1 ? 'My stores' : store.name,
      detail:
        store.status === 'pending' ? 'Waiting for approval'
        : store.status === 'rejected' ? 'Needs changes before approval'
        : newStoreOrders > 0 ? `${plural(newStoreOrders, 'new order')} to confirm`
        : 'Manage products and orders',
      highlight: newStoreOrders > 0 || store.status === 'rejected',
    });
  } else {
    tiles.push({ to: '/register-store', icon: Store, title: 'Sell on Clotz Hub', detail: 'Open your own clothing store' });
  }

  if (isAdmin) {
    tiles.push({
      to: '/admin',
      icon: ShieldCheck,
      title: 'Admin dashboard',
      detail: pendingStores > 0 ? `${plural(pendingStores, 'store')} awaiting approval` : 'Approve, feature and manage stores',
      highlight: pendingStores > 0,
    });
  }

  return (
    <section className="border-b border-border bg-card/40">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold">{firstName ? `Hi, ${firstName}` : 'Good to see you'}</h2>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />Admin
            </span>
          )}
        </div>
        <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 ${tiles.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {tiles.map(t => (
            <Link
              key={t.to + t.title}
              to={t.to}
              className={`group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-primary/60 ${
                t.highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}>
                <t.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{t.title}</p>
                <p className="text-sm text-muted-foreground truncate">{t.detail}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
