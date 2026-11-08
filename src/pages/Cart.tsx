import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, Store } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatKES, PLACEHOLDER_IMAGE } from '@/lib/marketplace';
import { groupByStore } from '@/lib/cart';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const groups = groupByStore(items);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Visit a store and add something you like</p>
          <div className="flex gap-3 justify-center">
            <Link to="/stores"><Button variant="gold">Browse Stores</Button></Link>
            <Link to="/products"><Button variant="outline">All Products</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />Continue Shopping
        </Link>
        <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart ({itemCount})</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {groups.map(group => (
              <div key={group.storeId} className="space-y-3">
                <Link to={`/store/${group.storeId}`} className="flex items-center gap-2 font-semibold hover:text-primary">
                  <Store className="w-4 h-4 text-primary" />{group.storeName}
                </Link>
                {group.items.map(item => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                    <Link to={`/product/${item.product.id}`} className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img src={item.product.image ?? PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {[item.size && `Size: ${item.size}`, item.color && `Colour: ${item.color}`].filter(Boolean).join(' · ') || formatKES(item.product.price)}
                      </p>
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <div className="flex items-center border border-border rounded-lg">
                          <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)} className="p-2 hover:bg-secondary" aria-label="Decrease"><Minus className="w-3 h-3" /></button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-2 hover:bg-secondary disabled:opacity-40"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-primary">{formatKES(item.product.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.product.id, item.size, item.color)} className="p-2 h-fit text-muted-foreground hover:text-destructive" aria-label="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              {groups.map(g => (
                <div key={g.storeId} className="flex justify-between">
                  <span className="text-muted-foreground line-clamp-1">{g.storeName}</span>
                  <span>{formatKES(g.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-primary">Chosen at checkout</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span className="text-primary">{formatKES(subtotal)}</span>
              </div>
            </div>
            <Button variant="gold" className="w-full mt-6" size="lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
            {groups.length > 1 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Your cart has items from {groups.length} stores. Each store gets its own order.
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center mt-2">Pay with M-Pesa or cash on delivery</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
