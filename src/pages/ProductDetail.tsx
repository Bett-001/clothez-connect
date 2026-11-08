import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Truck, Shield, ArrowLeft, Store, Zap } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { useProduct, useProducts, usePublicStore } from '@/hooks/useMarketplace';
import { categoryName, formatKES, productImages, PLACEHOLDER_IMAGE, storeLocationLine } from '@/lib/marketplace';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const { data: store } = usePublicStore(product?.store_id);
  const { data: related } = useProducts({ storeId: product?.store_id, excludeId: id, inStockOnly: true, limit: 4 });
  const { addItem, items } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(0);

  const sizes = product?.sizes ?? [];
  const colors = product?.colors ?? [];

  useEffect(() => {
    setMainImage(0);
    setQuantity(1);
    setSelectedSize(sizes.length === 1 ? sizes[0] : '');
    setSelectedColor(colors.length === 1 ? colors[0] : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 grid lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-[3/4] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link to="/products" className="text-primary hover:underline mt-4 block">Browse all products</Link>
        </div>
      </Layout>
    );
  }

  const images = productImages(product);
  const gallery = images.length ? images : [PLACEHOLDER_IMAGE];
  const inCart = items
    .filter(i => i.product.id === product.id)
    .reduce((sum, i) => sum + i.quantity, 0);
  const available = Math.max(product.stock - inCart, 0);
  const needsSize = sizes.length > 0 && !selectedSize;
  const needsColor = colors.length > 0 && !selectedColor;
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null;

  const addToCart = () => {
    if (needsSize || needsColor) {
      toast.error(`Please choose a ${needsSize ? 'size' : 'colour'} first`);
      return false;
    }
    if (available < quantity) {
      toast.error(available === 0 ? 'You already have all available stock in your cart' : `Only ${available} more available`);
      return false;
    }
    addItem(
      {
        id: product.id,
        storeId: product.store_id,
        storeName: product.stores?.name ?? store?.name ?? 'Store',
        name: product.name,
        price: Number(product.price),
        image: images[0] ?? null,
        stock: product.stock,
      },
      selectedSize,
      selectedColor,
      quantity,
    );
    return true;
  };

  const optionButton = (active: boolean) =>
    cn(
      'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary',
    );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />Back
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-card">
              <img src={gallery[mainImage] ?? gallery[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setMainImage(i)}
                    className={cn('w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors', mainImage === i ? 'border-primary' : 'border-transparent')}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 text-xs mb-2">
                <Link to={`/products?category=${product.category}`} className="px-2 py-1 rounded-full bg-secondary hover:text-primary">
                  {categoryName(product.category)}
                </Link>
                {product.product_type && (
                  <Link to={`/products?type=${encodeURIComponent(product.product_type)}`} className="px-2 py-1 rounded-full bg-secondary hover:text-primary">
                    {product.product_type}
                  </Link>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">{product.name}</h1>
              {product.brand && <p className="text-muted-foreground mt-1">by {product.brand}</p>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{formatKES(product.price)}</span>
              {discount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">{formatKES(product.original_price)}</span>
                  <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold">-{discount}%</span>
                </>
              )}
            </div>

            <p className={cn('text-sm font-medium', product.stock > 0 ? 'text-green-500' : 'text-destructive')}>
              {product.stock <= 0 ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
            </p>

            {product.description && <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>}
            {product.material && <p className="text-sm"><span className="text-muted-foreground">Material:</span> {product.material}</p>}

            {sizes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={optionButton(selectedSize === size)}>{size}</button>
                  ))}
                </div>
              </div>
            )}
            {colors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Colour</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)} className={optionButton(selectedColor === color)}>{color}</button>
                  ))}
                </div>
              </div>
            )}

            {product.stock > 0 && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Quantity</h3>
                  <div className="inline-flex items-center border border-border rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-secondary" aria-label="Decrease"><Minus className="w-4 h-4" /></button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(Math.max(available, 1), quantity + 1))} className="p-3 hover:bg-secondary" aria-label="Increase"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="gold" size="lg" className="flex-1" onClick={addToCart}>
                    <ShoppingBag className="w-5 h-5" />Add to Cart
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => addToCart() && navigate('/checkout')}>
                    <Zap className="w-5 h-5" />Buy Now
                  </Button>
                </div>
              </>
            )}

            <Link
              to={`/store/${product.store_id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                {store?.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Sold by</p>
                <p className="font-semibold">{product.stores?.name ?? store?.name}</p>
                {store && storeLocationLine(store) && <p className="text-xs text-muted-foreground">{storeLocationLine(store)}</p>}
              </div>
              <span className="text-sm text-primary">Visit store →</span>
            </Link>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-4 border-t border-border">
              {store?.offers_delivery && (
                <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Delivery from {formatKES(store.delivery_fee)}</span>
              )}
              {store?.offers_pickup && <span className="flex items-center gap-2"><Store className="w-4 h-4 text-primary" />Free in-store pickup</span>}
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Verified seller</span>
            </div>
          </div>
        </div>

        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">More from {product.stores?.name ?? 'this store'}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} showStore={false} />)}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
