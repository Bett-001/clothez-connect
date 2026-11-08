import { Link } from 'react-router-dom';
import { categoryName, formatKES, productImages, PLACEHOLDER_IMAGE, type ProductWithStore } from '@/lib/marketplace';

interface ProductCardProps {
  product: ProductWithStore;
  index?: number;
  showStore?: boolean;
}

export function ProductCard({ product, index = 0, showStore = true }: ProductCardProps) {
  const image = productImages(product)[0] ?? PLACEHOLDER_IMAGE;
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null;
  const sizes = product.sizes ?? [];
  const soldOut = product.stock <= 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover-lift animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {discount && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold">
            -{discount}%
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-background text-sm font-medium">Sold out</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1">
          <span className="px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium">
            {categoryName(product.category)}
          </span>
          {product.product_type && (
            <span className="px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium">
              {product.product_type}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {showStore && product.stores && (
          <p className="text-xs text-muted-foreground mb-1">{product.stores.name}</p>
        )}
        <h3 className="font-medium text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{formatKES(product.price)}</span>
          {discount && (
            <span className="text-sm text-muted-foreground line-through">{formatKES(product.original_price)}</span>
          )}
        </div>
        {sizes.length > 0 && (
          <div className="mt-3 flex gap-1 flex-wrap">
            {sizes.slice(0, 4).map(size => (
              <span
                key={size}
                className="min-w-7 h-7 px-1 rounded-md border border-border flex items-center justify-center text-xs text-muted-foreground"
              >
                {size}
              </span>
            ))}
            {sizes.length > 4 && (
              <span className="h-7 px-1 rounded-md border border-border flex items-center justify-center text-xs text-muted-foreground">
                +{sizes.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
          <div className="aspect-[3/4] bg-muted animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
