import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, CartProduct } from '@/types';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'clotzhub-cart-v2';

interface CartContextType {
  items: CartItem[];
  addItem: (product: CartProduct, size: string, color: string, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const sameLine = (item: CartItem, productId: string, size: string, color: string) =>
  item.product.id === productId && item.size === size && item.color === color;

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable in private browsing; the cart still works in memory.
    }
  }, [items]);

  const addItem = useCallback((product: CartProduct, size: string, color: string, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => sameLine(item, product.id, size, color));
      if (existing) {
        return prev.map(item =>
          sameLine(item, product.id, size, color)
            ? { ...item, product, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item,
        );
      }
      return [...prev, { product, size, color, quantity: Math.min(quantity, product.stock) }];
    });

    toast({ title: 'Added to cart', description: `${product.name} is in your cart.` });
  }, []);

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    setItems(prev => prev.filter(item => !sameLine(item, productId, size, color)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(item =>
        sameLine(item, productId, size, color)
          ? { ...item, quantity: Math.min(quantity, Math.max(item.product.stock, 1)) }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    }),
    [items, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
