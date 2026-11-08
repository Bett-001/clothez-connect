import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard, ProductGridSkeleton } from '@/components/products/ProductCard';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProducts, type ProductSort } from '@/hooks/useMarketplace';
import { CATEGORIES, PRODUCT_TYPES, categoryName } from '@/lib/marketplace';
import { cn } from '@/lib/utils';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category');
  const productType = params.get('type');
  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as ProductSort) || 'newest';
  const [searchInput, setSearchInput] = useState(q);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // Search as the shopper types, with a short pause.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== q) update('q', searchInput.trim() || null);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data: products, isLoading, error } = useProducts({
    category,
    productType,
    search: q,
    sort,
    inStockOnly,
  });

  const pill = (active: boolean) =>
    cn(
      'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    );

  const heading = category ? `${categoryName(category)}'s Clothing` : 'All Products';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">{heading}</h1>
        <p className="text-muted-foreground mb-8">Everything for sale across every store on Clotz Hub</p>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search for dresses, jeans, school uniform..."
              className="pl-10"
            />
          </div>
          <select
            value={productType ?? ''}
            onChange={e => update('type', e.target.value || null)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm md:w-56"
            aria-label="Product type"
          >
            <option value="">All types</option>
            {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={sort}
            onChange={e => update('sort', e.target.value === 'newest' ? null : e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm md:w-48"
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => update('category', null)} className={pill(!category)}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => update('category', cat.id)} className={pill(category === cat.id)}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Switch id="in-stock" checked={inStockOnly} onCheckedChange={setInStockOnly} />
            <Label htmlFor="in-stock" className="text-sm">In stock only</Label>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <p className="text-center text-destructive py-16">Could not load products. Please refresh the page.</p>
        ) : products && products.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground">Try another search or category.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
