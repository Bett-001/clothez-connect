import { Link } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreCard, StoreGridSkeleton } from '@/components/stores/StoreCard';
import { usePublicStores } from '@/hooks/useMarketplace';

export function FeaturedStores() {
  const { data: stores, isLoading } = usePublicStores();
  const featured = [...(stores ?? [])]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <section className="py-16 md:py-24 bg-card/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Shop by Store</h2>
            <p className="text-muted-foreground">Walk into any shop on Clotz Hub, each run by its own owner</p>
          </div>
          <Link to="/stores">
            <Button variant="outline">
              View All Stores
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <StoreGridSkeleton count={3} />
        ) : featured.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">No stores are open yet.</p>
            <Link to="/register-store" className="text-primary hover:underline">Open the first store →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((store, i) => <StoreCard key={store.id} store={store} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}
