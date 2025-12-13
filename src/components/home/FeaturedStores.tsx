import { Link } from 'react-router-dom';
import { Star, ArrowRight, MapPin } from 'lucide-react';
import { mockStores } from '@/data/mockData';
import { Button } from '@/components/ui/button';

export function FeaturedStores() {
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Featured Stores
            </h2>
            <p className="text-muted-foreground">
              Discover top-rated vendors trusted by thousands of shoppers
            </p>
          </div>
          <Link to="/stores">
            <Button variant="outline">
              View All Stores
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockStores.map((store, index) => (
            <Link
              key={store.id}
              to={`/store/${store.id}`}
              className="group bg-background rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Banner */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={store.banner}
                  alt={store.businessName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>

              {/* Logo */}
              <div className="relative px-4 -mt-8">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-background shadow-lg">
                  <img
                    src={store.logo}
                    alt={store.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 pt-2">
                <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {store.businessName}
                </h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" />
                  {store.address}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-medium">{store.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({store.reviewCount})
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {store.categories.map(cat => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
