import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Store } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoreCard, StoreGridSkeleton } from '@/components/stores/StoreCard';
import { usePublicStores } from '@/hooks/useMarketplace';
import { CATEGORIES } from '@/lib/marketplace';
import { cn } from '@/lib/utils';

const ALL = '__all__';

export default function Stores() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(ALL);
  const { data: stores, isLoading, error } = usePublicStores();

  const cities = useMemo(
    () => Array.from(new Set((stores ?? []).map(s => s.city?.trim()).filter(Boolean) as string[])).sort(),
    [stores],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (stores ?? [])
      .filter(s => !category || (s.categories ?? []).includes(category))
      .filter(s => city === ALL || s.city?.trim() === city)
      .filter(
        s =>
          !term ||
          [s.name, s.tagline, s.description, s.location, s.city].some(v => v?.toLowerCase().includes(term)),
      )
      .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.name.localeCompare(b.name));
  }, [stores, category, city, search]);

  const setCategory = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('category', id);
    else next.delete('category');
    setParams(next, { replace: true });
  };

  const pill = (active: boolean) =>
    cn(
      'px-4 py-2 rounded-full text-sm font-medium transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">Stores</h1>
        <p className="text-muted-foreground mb-8">Choose a shop and browse everything it sells</p>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stores by name or area"
              className="pl-10"
            />
          </div>
          {cities.length > 0 && (
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="lg:w-56">
                <SelectValue placeholder="All towns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All towns</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setCategory(null)} className={pill(!category)}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)} className={pill(category === cat.id)}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <StoreGridSkeleton />
        ) : error ? (
          <p className="text-center text-destructive py-16">Could not load stores. Please refresh the page.</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {stores?.length ? 'No stores match your search' : 'No stores yet'}
            </h2>
            {!stores?.length && (
              <Link to="/register-store" className="text-primary hover:underline">Register your store →</Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} {filtered.length === 1 ? 'store' : 'stores'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((store, i) => <StoreCard key={store.id} store={store} index={i} />)}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
