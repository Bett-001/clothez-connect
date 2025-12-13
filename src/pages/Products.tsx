import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProducts, categories } from '@/data/mockData';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Products() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [filter, setFilter] = useState<string | null>(initialCategory);

  const filteredProducts = filter 
    ? mockProducts.filter(p => p.category === filter)
    : mockProducts;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground mb-8">Discover amazing fashion from verified Kenyan stores</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setFilter(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
        </div>
      </div>
    </Layout>
  );
}
