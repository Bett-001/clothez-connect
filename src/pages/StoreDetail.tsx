import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, Truck, Store, Search, Instagram, MessageCircle, Smartphone, Banknote, ShoppingBag, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard, ProductGridSkeleton } from '@/components/products/ProductCard';
import { StoreReviews } from '@/components/stores/StoreReviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicStore, useProducts, type ProductSort } from '@/hooks/useMarketplace';
import { CATEGORIES, formatKES, whatsappLink, type CategoryId } from '@/lib/marketplace';
import { cn } from '@/lib/utils';

export default function StoreDetail() {
  const { id } = useParams();
  const { data: store, isLoading } = usePublicStore(id);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ProductSort>('newest');
  const { data: products, isLoading: productsLoading } = useProducts({
    storeId: id,
    category,
    search,
    sort,
  });

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-64 md:h-80 w-full" />
        <div className="container mx-auto px-4 -mt-20 relative pb-16">
          <Skeleton className="w-28 h-28 rounded-2xl mb-4" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-2xl" />
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
          <p className="text-muted-foreground mt-2">It may be closed or still waiting for approval.</p>
          <Link to="/stores" className="text-primary hover:underline mt-4 block">Browse all stores</Link>
        </div>
      </Layout>
    );
  }

  const storeCategories = CATEGORIES.filter(c => (store.categories ?? []).includes(c.id));
  const address = [store.address, store.location, store.city].filter(Boolean).join(', ');
  const mapHref =
    store.map_url || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${address}`)}` : null);

  return (
    <Layout>
      <div className="relative h-56 md:h-80">
        {store.banner_url ? (
          <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/25 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative pb-16">
        <div className="flex flex-col md:flex-row gap-6 items-start mb-10">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-muted shrink-0">
            {store.logo_url ? (
              <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl md:text-4xl font-bold">{store.name}</h1>
            {store.tagline && <p className="text-lg text-primary mt-1">{store.tagline}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                {store.review_count > 0 ? `${Number(store.avg_rating).toFixed(1)} (${store.review_count} reviews)` : 'New store'}
              </span>
              <span className="flex items-center gap-1"><ShoppingBag className="w-4 h-4" />{store.product_count} products</span>
              {address && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{address}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {storeCategories.map(c => (
                <span key={c.id} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
                  {c.icon} {c.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {store.whatsapp && (
              <a href={whatsappLink(store.whatsapp, `Hi ${store.name}, I found you on Clotz Hub.`)} target="_blank" rel="noopener noreferrer">
                <Button variant="gold"><MessageCircle className="w-4 h-4" />WhatsApp</Button>
              </a>
            )}
            {store.instagram && (
              <a href={`https://instagram.com/${store.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" aria-label="Instagram"><Instagram className="w-4 h-4" /></Button>
              </a>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${store.name}`} className="pl-10" />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as ProductSort)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
            {storeCategories.length > 1 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {[{ id: null, name: 'All', icon: '' }, ...storeCategories].map(c => (
                  <button
                    key={c.id ?? 'all'}
                    onClick={() => setCategory(c.id as CategoryId | null)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                      category === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    )}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            )}

            {productsLoading ? (
              <ProductGridSkeleton count={6} />
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} showStore={false} />)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12 bg-card rounded-xl border border-border">
                {search || category ? 'No products match your filters.' : 'This store has not added products yet.'}
              </p>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
            {store.description && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-2">About the store</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{store.description}</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-sm">
              {store.opening_hours && (
                <div className="flex gap-3">
                  <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div><p className="font-medium">Opening hours</p><p className="text-muted-foreground whitespace-pre-line">{store.opening_hours}</p></div>
                </div>
              )}
              {address && (
                <div className="flex gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Find us</p>
                    <p className="text-muted-foreground">{address}</p>
                    {mapHref && (
                      <a href={mapHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
                        Open in Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Delivery & pickup</p>
                  {store.offers_delivery && (
                    <p className="text-muted-foreground">
                      Delivery {Number(store.delivery_fee) > 0 ? formatKES(store.delivery_fee) : 'free'}
                      {store.free_delivery_threshold != null && Number(store.delivery_fee) > 0 &&
                        `, free over ${formatKES(store.free_delivery_threshold)}`}
                    </p>
                  )}
                  {store.offers_pickup && <p className="text-muted-foreground">Free pickup from the shop</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <Smartphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Payment</p>
                  {(store.mpesa_till || store.mpesa_paybill) && <p className="text-muted-foreground">M-Pesa</p>}
                  {store.accepts_cash && (
                    <p className="text-muted-foreground flex items-center gap-1"><Banknote className="w-3.5 h-3.5" />Cash on delivery or pickup</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <StoreReviews storeId={store.id} />
      </div>
    </Layout>
  );
}
