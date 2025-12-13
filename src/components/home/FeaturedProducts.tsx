import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';

export function FeaturedProducts() {
  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Trending Products
            </h2>
            <p className="text-muted-foreground">
              Handpicked favorites from our verified stores
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
