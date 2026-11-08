import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/lib/marketplace';

export function CategorySection() {
  const categoryImages = {
    gents: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    ladies: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop',
    kids: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&h=500&fit=crop',
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Men, women and kids. Browse every store's collection in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {CATEGORIES.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <img
                src={categoryImages[category.id as keyof typeof categoryImages]}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <span className="text-4xl mb-2 block">{category.icon}</span>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-cream mb-1">
                  {category.name}
                </h3>
                <p className="text-cream/70 text-sm mb-2">{category.blurb}</p>
                <span className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-4 transition-all">
                  Browse Collection
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
