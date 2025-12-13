import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, ShoppingBag, Minus, Plus, Star, Truck, Shield, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const product = mockProducts.find(p => p.id === id);
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(0);

  if (!product) return <Layout><div className="container py-20 text-center"><h1 className="text-2xl font-bold">Product not found</h1><Link to="/products" className="text-primary hover:underline mt-4 block">Browse all products</Link></div></Layout>;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) return;
    addItem(product, selectedSize, selectedColor, quantity);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="w-4 h-4" />Back to products</Link>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-card"><img src={product.images[mainImage]} alt={product.name} className="w-full h-full object-cover" /></div>
            {product.images.length > 1 && <div className="flex gap-3">{product.images.map((img, i) => <button key={i} onClick={() => setMainImage(i)} className={cn("w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors", mainImage === i ? "border-primary" : "border-transparent")}><img src={img} alt="" className="w-full h-full object-cover" /></button>)}</div>}
          </div>
          <div className="space-y-6">
            <div>
              <Link to={`/store/${product.storeId}`} className="text-sm text-primary hover:underline">{product.storeName}</Link>
              <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">{product.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" /><span className="font-medium">4.8</span><span className="text-muted-foreground">(24 reviews)</span></div>
              </div>
            </div>
            <div className="flex items-baseline gap-3"><span className="text-3xl font-bold text-primary">KSh {product.price.toLocaleString()}</span>{product.originalPrice && <span className="text-xl text-muted-foreground line-through">KSh {product.originalPrice.toLocaleString()}</span>}</div>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            <div><h3 className="font-semibold mb-3">Size</h3><div className="flex flex-wrap gap-2">{product.sizes.map(size => <button key={size} onClick={() => setSelectedSize(size)} className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all", selectedSize === size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>{size}</button>)}</div></div>
            <div><h3 className="font-semibold mb-3">Color</h3><div className="flex flex-wrap gap-2">{product.colors.map(color => <button key={color} onClick={() => setSelectedColor(color)} className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all", selectedColor === color ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>{color}</button>)}</div></div>
            <div><h3 className="font-semibold mb-3">Quantity</h3><div className="inline-flex items-center border border-border rounded-lg"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-secondary"><Minus className="w-4 h-4" /></button><span className="w-12 text-center font-medium">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-secondary"><Plus className="w-4 h-4" /></button></div></div>
            <div className="flex gap-3"><Button variant="gold" size="lg" className="flex-1" onClick={handleAddToCart} disabled={!selectedSize || !selectedColor}><ShoppingBag className="w-5 h-5" />Add to Cart</Button><Button variant="outline" size="lg"><Heart className="w-5 h-5" /></Button></div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-4 border-t border-border"><span className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Fast delivery across Kenya</span><span className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Verified seller</span></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
