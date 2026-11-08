import type { CartItem } from '@/types';

/** Splits cart lines by store, since each store gets its own order. */
export function groupByStore(items: CartItem[]) {
  const groups = new Map<string, { storeId: string; storeName: string; items: CartItem[]; subtotal: number }>();
  for (const item of items) {
    const g = groups.get(item.product.storeId) ?? {
      storeId: item.product.storeId,
      storeName: item.product.storeName,
      items: [],
      subtotal: 0,
    };
    g.items.push(item);
    g.subtotal += item.product.price * item.quantity;
    groups.set(item.product.storeId, g);
  }
  return Array.from(groups.values());
}
