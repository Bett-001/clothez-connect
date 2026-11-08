import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductGridSkeleton } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useMarketplace';

export function FeaturedProducts() {
  const featured = useProducts({ featured: true, inStockOnly: true, limit: 8 });
  const latest = useProducts({ inStockOnly: true, limit: 8 });
  const products = featured.data?.length ? featured.data : latest.data ?? [];
  const isLoading = featured.isLoading || (!featured.data?.length && latest.isLoading);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {featured.data?.length ? 'Trending Now' : 'New Arrivals'}
            </h2>
            <p className="text-muted-foreground">Fresh picks from stores across the marketplace</p>
          </div>
          <Link to="/products">
            <Button variant="outline">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}
