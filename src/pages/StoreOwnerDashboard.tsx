import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ExternalLink, Loader2, Store, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { OrdersTab, useStoreOrders } from '@/components/dashboard/OrdersTab';
import { ProductsTab } from '@/components/dashboard/ProductsTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';

export default function StoreOwnerDashboard() {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();

  const { data: stores, isLoading } = useQuery({
    queryKey: ['my-store', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('stores').select('*').eq('owner_id', user!.id).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const store = stores?.find(s => s.id === params.get('store')) ?? stores?.[0] ?? null;

  const approved = store?.status === 'approved';
  const { data: orders } = useStoreOrders(approved ? store!.id : '');
  const newOrders = (orders ?? []).filter(o => o.status === 'pending').length;

  if (loading || (user && isLoading)) {
    return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!user) return <Navigate to="/auth?mode=store&redirect=/my-store" replace />;

  if (!store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">You don't have a store yet</h1>
          <p className="text-muted-foreground mb-6">Register your clothing store to start selling on Clotz Hub.</p>
          <Link to="/register-store"><Button variant="gold">Register your store</Button></Link>
        </div>
      </Layout>
    );
  }

  const defaultTab = approved ? 'overview' : 'settings';
  const tab = params.get('tab') ?? defaultTab;
  const setTab = (t: string) => setParams({ store: store.id, tab: t }, { replace: true });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-7 h-7 text-muted-foreground" />}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">{store.name}</h1>
              {stores && stores.length > 1 ? (
                <select
                  value={store.id}
                  onChange={e => setParams({ store: e.target.value }, { replace: true })}
                  className="mt-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                  aria-label="Switch store"
                >
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <p className="text-muted-foreground">Store dashboard</p>
              )}
            </div>
          </div>
          {approved && (
            <Link to={`/store/${store.id}`}>
              <Button variant="outline"><ExternalLink className="w-4 h-4" />View my store</Button>
            </Link>
          )}
        </div>

        {store.status === 'pending' && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">Your store is waiting for approval. You can finish your store profile now. Products and orders unlock once it's approved.</p>
          </div>
        )}
        {store.status === 'rejected' && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex gap-3">
            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Your application was not approved.</p>
              {store.rejection_reason && <p className="text-muted-foreground">Reason: {store.rejection_reason}</p>}
              <p className="text-muted-foreground">Update your details below and resubmit.</p>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap h-auto">
            {approved && <TabsTrigger value="overview">Overview</TabsTrigger>}
            {approved && (
              <TabsTrigger value="orders">
                Orders
                {newOrders > 0 && <span className="ml-2 px-1.5 rounded-full bg-primary text-primary-foreground text-xs">{newOrders}</span>}
              </TabsTrigger>
            )}
            {approved && <TabsTrigger value="products">Products</TabsTrigger>}
            <TabsTrigger value="settings">Store profile</TabsTrigger>
          </TabsList>
          {approved && (
            <>
              <TabsContent value="overview"><OverviewTab store={store} onOpenTab={setTab} /></TabsContent>
              <TabsContent value="orders"><OrdersTab storeId={store.id} /></TabsContent>
              <TabsContent value="products"><ProductsTab key={store.id} store={store} /></TabsContent>
            </>
          )}
          <TabsContent value="settings"><SettingsTab key={`${store.id}-${store.updated_at}`} store={store} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
