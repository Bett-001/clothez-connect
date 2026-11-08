import { Link } from 'react-router-dom';
import { MapPin, Star, Store as StoreIcon, Truck, ShoppingBag } from 'lucide-react';
import { categoryName, storeLocationLine, type PublicStore } from '@/lib/marketplace';

export function StoreCard({ store, index = 0 }: { store: PublicStore; index?: number }) {
  const location = storeLocationLine(store);
  return (
    <Link
      to={`/store/${store.id}`}
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover-lift animate-slide-up flex flex-col"
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <div className="relative h-36">
        {store.banner_url ? (
          <img src={store.banner_url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/25 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        {store.is_featured && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            Featured
          </span>
        )}
      </div>
      <div className="p-5 -mt-10 relative flex-1 flex flex-col">
        <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-card shadow-lg mb-3 bg-muted">
          {store.logo_url ? (
            <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <StoreIcon className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
        </div>
        <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">{store.name}</h3>
        {store.tagline && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{store.tagline}</p>}
        {location && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-3">
          {(store.categories ?? []).map(c => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
              {categoryName(c)}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-4 text-sm">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            {store.review_count > 0 ? (
              <>
                <span className="font-medium">{Number(store.avg_rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({store.review_count})</span>
              </>
            ) : (
              <span className="text-muted-foreground">New store</span>
            )}
          </span>
          <span className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{store.product_count}</span>
            {store.offers_delivery && <Truck className="w-4 h-4" aria-label="Delivers" />}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function StoreGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
          <div className="h-36 bg-muted animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="w-16 h-16 rounded-xl bg-muted animate-pulse -mt-12" />
            <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
