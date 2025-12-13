import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { mockStores, mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';

export default function StoreDetail() {
  const { id } = useParams();
  const store = mockStores.find(s => s.id === id);
  const products = mockProducts.filter(p => p.storeId === id);

  if (!store) return <Layout><div className="container py-20 text-center"><h1 className="text-2xl font-bold">Store not found</h1><Link to="/stores" className="text-primary hover:underline mt-4 block">Browse all stores</Link></div></Layout>;

  return (
    <Layout>
      <div className="relative h-64 md:h-80"><img src={store.banner} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" /></div>
      <div className="container mx-auto px-4 -mt-20 relative pb-16">
        <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-background shadow-xl"><img src={store.logo} alt="" className="w-full h-full object-cover" /></div>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{store.businessName}</h1>
            <p className="text-muted-foreground mb-4 max-w-2xl">{store.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" />{store.rating} ({store.reviewCount} reviews)</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{store.address}</span>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{store.phone}</span>
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
