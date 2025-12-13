import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover-lift animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold">
            -{discount}%
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
          <Button
            variant="secondary"
            size="icon"
            className="w-9 h-9 rounded-full"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="w-9 h-9 rounded-full"
            onClick={(e) => e.preventDefault()}
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>

        {/* Category */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium capitalize">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.storeName}</p>
        <h3 className="font-medium text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            KSh {product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              KSh {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Sizes Preview */}
        <div className="mt-3 flex gap-1">
          {product.sizes.slice(0, 4).map(size => (
            <span
              key={size}
              className={cn(
                "w-7 h-7 rounded-md border border-border flex items-center justify-center text-xs",
                "text-muted-foreground"
              )}
            >
              {size}
            </span>
          ))}
          {product.sizes.length > 4 && (
            <span className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-xs text-muted-foreground">
              +{product.sizes.length - 4}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
