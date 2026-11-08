import type { Database, Tables } from '@/integrations/supabase/types';

export type CategoryId = 'gents' | 'ladies' | 'kids';

export const CATEGORIES: { id: CategoryId; name: string; icon: string; blurb: string }[] = [
  { id: 'gents', name: 'Men', icon: '👔', blurb: 'Shirts, suits, jeans and more' },
  { id: 'ladies', name: 'Women', icon: '👗', blurb: 'Dresses, tops, skirts and more' },
  { id: 'kids', name: 'Kids', icon: '🧸', blurb: 'Playwear, uniforms and more' },
];

export const categoryName = (id: string | null | undefined) =>
  CATEGORIES.find(c => c.id === id)?.name ?? id ?? '';

export const PRODUCT_TYPES = [
  'Shirts',
  'T-Shirts & Tops',
  'Trousers',
  'Jeans',
  'Shorts',
  'Dresses',
  'Skirts',
  'Suits & Blazers',
  'Jackets & Coats',
  'Sweaters & Hoodies',
  'Traditional & African Wear',
  'Activewear',
  'Sleepwear',
  'Underwear',
  'School Uniforms',
  'Shoes',
  'Bags',
  'Accessories',
  'Other',
] as const;

export type ProductRow = Tables<'products'>;
export type ProductWithStore = ProductRow & { stores: { id: string; name: string } | null };
export type PublicStore = Database['public']['Functions']['get_public_stores']['Returns'][number];
export type StoreRow = Tables<'stores'>;
export type OrderRow = Tables<'orders'>;
export type OrderItemRow = Tables<'order_items'>;
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type FulfillmentMethod = Database['public']['Enums']['fulfillment_method'];

export const formatKES = (amount: number | string | null | undefined) =>
  `KSh ${Number(amount ?? 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export const formatDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

export function productImages(p: Pick<ProductRow, 'image_url' | 'images'>): string[] {
  const all = [p.image_url, ...(p.images ?? [])].filter((x): x is string => !!x);
  return Array.from(new Set(all));
}

export const PLACEHOLDER_IMAGE = '/placeholder.svg';

export const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting confirmation', className: 'bg-primary/15 text-primary' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-500/15 text-blue-400' },
  processing: { label: 'Being prepared', className: 'bg-indigo-500/15 text-indigo-400' },
  shipped: { label: 'Out for delivery', className: 'bg-purple-500/15 text-purple-400' },
  delivered: { label: 'Completed', className: 'bg-green-500/15 text-green-500' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/15 text-destructive' },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: 'Unpaid', className: 'bg-secondary text-secondary-foreground' },
  pending_verification: { label: 'Verifying payment', className: 'bg-primary/15 text-primary' },
  paid: { label: 'Paid', className: 'bg-green-500/15 text-green-500' },
  failed: { label: 'Payment failed', className: 'bg-destructive/15 text-destructive' },
  refunded: { label: 'Refunded', className: 'bg-secondary text-secondary-foreground' },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  cash: 'Cash on delivery / pickup',
};

/** Turns a Kenyan phone number into the international form WhatsApp links need. */
export function whatsappLink(phone: string, message?: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '254' + digits.slice(1);
  if (digits.length === 9) digits = '254' + digits;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function storeLocationLine(s: { location?: string | null; city?: string | null }) {
  return [s.location, s.city].filter(Boolean).join(', ');
}

/** Removes characters that would break a PostgREST `or()` filter. */
export const sanitizeSearch = (q: string) => q.replace(/[%,()*\\]/g, ' ').trim();

export function deliveryFeeFor(
  store: Pick<PublicStore, 'delivery_fee' | 'free_delivery_threshold'>,
  subtotal: number,
  method: FulfillmentMethod,
) {
  if (method === 'pickup') return 0;
  if (store.free_delivery_threshold != null && subtotal >= Number(store.free_delivery_threshold)) return 0;
  return Number(store.delivery_fee ?? 0);
}
