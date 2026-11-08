import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeSearch, type ProductWithStore, type PublicStore } from '@/lib/marketplace';

export function usePublicStores() {
  return useQuery({
    queryKey: ['public-stores'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_stores');
      if (error) throw error;
      return (data ?? []) as PublicStore[];
    },
    staleTime: 60_000,
  });
}

export function usePublicStore(id: string | undefined) {
  const query = usePublicStores();
  return { ...query, data: query.data?.find(s => s.id === id) ?? null };
}

export type ProductSort = 'newest' | 'price-asc' | 'price-desc';

export interface ProductFilters {
  category?: string | null;
  storeId?: string | null;
  productType?: string | null;
  search?: string | null;
  featured?: boolean;
  inStockOnly?: boolean;
  sort?: ProductSort;
  limit?: number;
  excludeId?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase.from('products').select('*, stores(id, name)').eq('is_active', true);

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.storeId) query = query.eq('store_id', filters.storeId);
      if (filters.productType) query = query.eq('product_type', filters.productType);
      if (filters.featured) query = query.eq('featured', true);
      if (filters.inStockOnly) query = query.gt('stock', 0);
      if (filters.excludeId) query = query.neq('id', filters.excludeId);
      const term = filters.search ? sanitizeSearch(filters.search) : '';
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%,product_type.ilike.%${term}%`,
        );
      }

      if (filters.sort === 'price-asc') query = query.order('price', { ascending: true });
      else if (filters.sort === 'price-desc') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProductWithStore[];
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(id, name)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as ProductWithStore | null;
    },
    enabled: !!id,
  });
}
