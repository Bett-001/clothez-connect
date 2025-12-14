import { Link } from 'react-router-dom';
import { Star, MapPin, Store } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { categories } from '@/data/mockData';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function Stores() {
  const [filter, setFilter] = useState<string | null>(null);

  const { data: stores, isLoading } = useQuery({
    queryKey: ['public-stores'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_stores');
      if (error) throw error;
      return data as PublicStore[];
    },
  });

  const filteredStores = stores || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">All Stores</h1>
        <p className="text-muted-foreground mb-8">Browse verified clothing stores across Kenya</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setFilter(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                <Skeleton className="h-40 w-full" />
                <div className="p-5">
                  <Skeleton className="w-16 h-16 rounded-xl mb-3" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No stores yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to register your store!</p>
            <Link to="/register-store" className="text-primary hover:underline">Register your store →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map(store => (
              <Link key={store.id} to={`/store/${store.id}`} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-40">
                  {store.banner_url ? (
                    <img src={store.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="p-5 -mt-10 relative">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-card shadow-lg mb-3 bg-muted">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">{store.name}</h3>
                  {store.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{store.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="font-medium">New</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
