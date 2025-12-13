import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-muted-foreground" /></div>
          <h1 className="font-display text-3xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
          <Link to="/products"><Button variant="gold">Browse Products</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="w-4 h-4" />Continue Shopping</Link>
        <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart ({items.length})</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                <Link to={`/product/${item.product.id}`} className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0"><img src={item.product.images[0]} alt="" className="w-full h-full object-cover" /></Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">{item.product.name}</Link>
                  <p className="text-sm text-muted-foreground">{item.product.storeName}</p>
                  <p className="text-sm text-muted-foreground mt-1">Size: {item.size} · Color: {item.color}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-border rounded-lg">
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)} className="p-2 hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)} className="p-2 hover:bg-secondary"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="font-bold text-primary">KSh {(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.product.id, item.size, item.color)} className="p-2 h-fit text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
            <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-primary">Calculated at checkout</span></div>
              <div className="border-t border-border pt-3 flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">KSh {subtotal.toLocaleString()}</span></div>
            </div>
            <Button variant="gold" className="w-full mt-6" size="lg">Proceed to Checkout</Button>
            <p className="text-xs text-muted-foreground text-center mt-4">M-Pesa, Card, and Till payments accepted</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
