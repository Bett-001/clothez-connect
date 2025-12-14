import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Mail, MessageCircle, Store } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface PublicStore {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FullStore extends PublicStore {
  email: string | null;
  phone: string | null;
  owner_id: string;
}

export default function StoreDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const products = mockProducts.filter(p => p.storeId === id);

  // First try to get full store data (for admins/owners)
  const { data: fullStore, isLoading: fullLoading } = useQuery({
    queryKey: ['store-full', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as FullStore | null;
    },
    enabled: !!user,
  });

  // For non-authenticated users, get public store data
  const { data: publicStore, isLoading: publicLoading } = useQuery({
    queryKey: ['store-public', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_stores');
      if (error) throw error;
      const stores = data as PublicStore[];
      return stores.find(s => s.id === id) || null;
    },
    enabled: !user,
  });

  const isLoading = user ? fullLoading : publicLoading;
  const store = user ? fullStore : publicStore;
  const canSeeContactInfo = isAdmin || (fullStore && user?.id === fullStore.owner_id);

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-64 md:h-80 w-full" />
        <div className="container mx-auto px-4 -mt-20 relative pb-16">
          <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
            <Skeleton className="w-28 h-28 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-full max-w-2xl mb-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!store) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">Store not found</h1>
          <Link to="/stores" className="text-primary hover:underline mt-4 block">Browse all stores</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative h-64 md:h-80">
        {store.banner_url ? (
          <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
      <div className="container mx-auto px-4 -mt-20 relative pb-16">
        <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-muted">
            {store.logo_url ? (
              <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{store.name}</h1>
            <p className="text-muted-foreground mb-4 max-w-2xl">{store.description || 'No description available.'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" />New Store</span>
              {store.location && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{store.location}</span>
              )}
              {canSeeContactInfo && 'phone' in store && (store as FullStore).phone && (
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{(store as FullStore).phone}</span>
              )}
              {canSeeContactInfo && 'email' in store && (store as FullStore).email && (
                <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{(store as FullStore).email}</span>
              )}
            </div>
          </div>
          <Button variant="gold"><MessageCircle className="w-4 h-4" />Message Store</Button>
        </div>
        <h2 className="font-display text-2xl font-bold mb-6">Products ({products.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {products.length === 0 && <p className="text-muted-foreground text-center py-12">No products available yet.</p>}
      </div>
    </Layout>
  );
}
