import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { mockStores, categories } from '@/data/mockData';
import { useState } from 'react';

export default function Stores() {
  const [filter, setFilter] = useState<string | null>(null);

  const filteredStores = filter 
    ? mockStores.filter(s => s.categories.includes(filter as 'gents' | 'ladies' | 'kids'))
    : mockStores;

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <Link key={store.id} to={`/store/${store.id}`} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-40"><img src={store.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /><div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" /></div>
              <div className="p-5 -mt-10 relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-card shadow-lg mb-3"><img src={store.logo} alt="" className="w-full h-full object-cover" /></div>
                <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">{store.businessName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{store.address}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" /><span className="font-medium">{store.rating}</span><span className="text-muted-foreground text-sm">({store.reviewCount})</span></div>
                  <span className="text-sm text-muted-foreground">{store.productCount} products</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
