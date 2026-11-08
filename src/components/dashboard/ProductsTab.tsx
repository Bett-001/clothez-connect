import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Package, Search, Eye, EyeOff, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiImageUpload } from '@/components/shared/ImageUpload';
import { CATEGORIES, PRODUCT_TYPES, categoryName, formatKES, productImages, PLACEHOLDER_IMAGE, type ProductRow, type StoreRow } from '@/lib/marketplace';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(100),
    description: z.string().trim().max(2000),
    category: z.enum(['gents', 'ladies', 'kids']),
    product_type: z.string(),
    brand: z.string().trim().max(60),
    material: z.string().trim().max(100),
    price: z.number().positive('Price must be more than 0'),
    original_price: z.number().positive().nullable(),
    stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
    sizes: z.array(z.string()),
    colors: z.array(z.string()),
    images: z.array(z.string()).min(1, 'Add at least one photo'),
    featured: z.boolean(),
    is_active: z.boolean(),
  })
  .refine(v => v.original_price == null || v.original_price > v.price, {
    message: 'The original price should be higher than the selling price',
    path: ['original_price'],
  });

type ProductForm = z.infer<typeof productSchema>;

const SIZE_PRESETS: Record<string, string[]> = {
  Clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'Waist (in)': ['28', '30', '32', '34', '36', '38', '40'],
  Shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  Kids: ['0-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y', '13-14Y'],
  Other: ['One Size'],
};

const emptyForm = (category: ProductForm['category'] = 'gents'): ProductForm => ({
  name: '',
  description: '',
  category,
  product_type: '',
  brand: '',
  material: '',
  price: 0,
  original_price: null,
  stock: 1,
  sizes: [],
  colors: [],
  images: [],
  featured: false,
  is_active: true,
});

function ChipInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])));
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-sm">
            {v}
            <button type="button" onClick={() => onChange(value.filter(x => x !== v))} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ProductsTab({ store }: { store: StoreRow }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm((store.categories?.[0] as ProductForm['category']) ?? 'gents'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['owner-products', store.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('store_id', store.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-products', store.id] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['public-stores'] });
  };

  const save = useMutation({
    mutationFn: async (data: ProductForm) => {
      const row = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        category: data.category,
        product_type: data.product_type || null,
        brand: data.brand.trim() || null,
        material: data.material.trim() || null,
        price: data.price,
        original_price: data.original_price,
        stock: data.stock,
        sizes: data.sizes,
        colors: data.colors,
        image_url: data.images[0] ?? null,
        images: data.images,
        featured: data.featured,
        is_active: data.is_active,
      };
      const { error } = editing
        ? await supabase.from('products').update(row).eq('id', editing.id)
        : await supabase.from('products').insert({ ...row, store_id: store.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? 'Product updated' : 'Product added');
      invalidate();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickUpdate = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProductRow> }) => {
      const { error } = await supabase.from('products').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Product deleted');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm((store.categories?.[0] as ProductForm['category']) ?? 'gents'));
    setErrors({});
    setOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      category: p.category as ProductForm['category'],
      product_type: p.product_type ?? '',
      brand: p.brand ?? '',
      material: p.material ?? '',
      price: Number(p.price),
      original_price: p.original_price == null ? null : Number(p.original_price),
      stock: p.stock,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      images: productImages(p),
      featured: p.featured,
      is_active: p.is_active,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const found: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const k = err.path[0]?.toString();
        if (k && !found[k]) found[k] = err.message;
      });
      setErrors(found);
      return;
    }
    setErrors({});
    save.mutate(result.data);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter(p => !term || p.name.toLowerCase().includes(term) || p.product_type?.toLowerCase().includes(term));
  }, [products, search]);

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive mt-1">{errors[k]}</p>;
  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your products" className="pl-10" />
        </div>
        <Button variant="gold" onClick={openNew}><Plus className="w-4 h-4" />Add product</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading products...</p>
      ) : !products?.length ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border">
          <Package className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No products yet</h2>
          <p className="text-muted-foreground mb-4">Add your first product so shoppers can buy from you.</p>
          <Button variant="gold" onClick={openNew}><Plus className="w-4 h-4" />Add your first product</Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {filtered.map(p => (
            <div key={p.id} className={cn('flex flex-col sm:flex-row sm:items-center gap-4 p-4', !p.is_active && 'opacity-60')}>
              <div className="flex gap-4 flex-1 min-w-0">
                <img src={productImages(p)[0] ?? PLACEHOLDER_IMAGE} alt="" className="w-14 h-16 rounded-lg object-cover bg-muted shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1 flex items-center gap-2">
                    {p.name}
                    {p.featured && <Star className="w-3.5 h-3.5 fill-primary text-primary shrink-0" />}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {categoryName(p.category)}{p.product_type ? ` · ${p.product_type}` : ''} · {formatKES(p.price)}
                  </p>
                  <p className={cn('text-xs', p.stock === 0 ? 'text-destructive' : p.stock <= 5 ? 'text-primary' : 'text-muted-foreground')}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}{!p.is_active && ' · Hidden from shoppers'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="number"
                  min={0}
                  defaultValue={p.stock}
                  key={`${p.id}-${p.stock}`}
                  className="w-20 h-9"
                  aria-label="Stock"
                  onBlur={e => {
                    const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    if (v !== p.stock) quickUpdate.mutate({ id: p.id, patch: { stock: v } });
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => quickUpdate.mutate({ id: p.id, patch: { is_active: !p.is_active } })} title={p.is_active ? 'Hide from shop' : 'Show in shop'}>
                  {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" />Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => confirm(`Delete "${p.name}"? Past orders keep their details.`) && remove.mutate(p.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground">No products match your search.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit product' : 'Add a product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Photos</Label>
              <div className="mt-2"><MultiImageUpload value={form.images} onChange={images => setForm({ ...form, images })} /></div>
              {err('images')}
            </div>

            <div>
              <Label htmlFor="p-name">Product name</Label>
              <Input id="p-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Slim-fit Cotton Shirt" className="mt-1" />
              {err('name')}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p-cat">Department</Label>
                <select
                  id="p-cat"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as ProductForm['category'] })}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="p-type">Type</Label>
                <select
                  id="p-type"
                  value={form.product_type}
                  onChange={e => setForm({ ...form, product_type: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choose a type</option>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Fit, fabric, care instructions..." rows={3} className="mt-1" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p-brand">Brand (optional)</Label>
                <Input id="p-brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="p-material">Material (optional)</Label>
                <Input id="p-material" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} placeholder="e.g. 100% cotton" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p-price">Price (KSh)</Label>
                <Input id="p-price" type="number" min={0} step="1" value={form.price || ''} onChange={e => setForm({ ...form, price: num(e.target.value) })} className="mt-1" />
                {err('price')}
              </div>
              <div>
                <Label htmlFor="p-orig">Was (optional)</Label>
                <Input id="p-orig" type="number" min={0} step="1" value={form.original_price ?? ''} onChange={e => setForm({ ...form, original_price: e.target.value === '' ? null : Number(e.target.value) })} className="mt-1" />
                {err('original_price')}
              </div>
              <div>
                <Label htmlFor="p-stock">In stock</Label>
                <Input id="p-stock" type="number" min={0} step="1" value={form.stock} onChange={e => setForm({ ...form, stock: num(e.target.value) })} className="mt-1" />
                {err('stock')}
              </div>
            </div>

            <div>
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2 my-2">
                {Object.entries(SIZE_PRESETS).map(([label, sizes]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm({ ...form, sizes: Array.from(new Set([...form.sizes, ...sizes])) })}
                    className="text-xs px-2 py-1 rounded border border-border hover:border-primary hover:text-primary"
                  >
                    + {label}
                  </button>
                ))}
              </div>
              <ChipInput value={form.sizes} onChange={sizes => setForm({ ...form, sizes })} placeholder="Type a size and press Enter. Leave empty if not needed." />
            </div>

            <div>
              <Label>Colours</Label>
              <div className="mt-2">
                <ChipInput value={form.colors} onChange={colors => setForm({ ...form, colors })} placeholder="Type a colour and press Enter, e.g. Navy" />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />Visible in shop</label>
              <label className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} />Feature on homepage</label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="gold" disabled={save.isPending}>{editing ? 'Save changes' : 'Add product'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
