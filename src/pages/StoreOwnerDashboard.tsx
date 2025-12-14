import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Store, AlertCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().trim().max(1000, 'Description must be less than 1000 characters').optional(),
  price: z.number().positive('Price must be positive'),
  original_price: z.number().positive('Original price must be positive').optional().nullable(),
  category: z.enum(['gents', 'ladies', 'kids']),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  in_stock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  image_url: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreData {
  id: string;
  name: string;
  status: string;
}

export default function StoreOwnerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    original_price: null,
    category: 'gents',
    image_url: '',
    sizes: [],
    colors: [],
    in_stock: true,
    featured: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch store owned by user
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['my-store', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, status')
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as StoreData | null;
    },
    enabled: !!user,
  });

  // Fetch products for the store
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!store?.id,
  });

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase.from('products').insert({
        store_id: store!.id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        original_price: data.original_price || null,
        category: data.category,
        image_url: data.image_url || null,
        sizes: data.sizes,
        colors: data.colors,
        in_stock: data.in_stock,
        featured: data.featured,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
      toast.success('Product created successfully!');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const { error } = await supabase.from('products').update({
        name: data.name,
        description: data.description || null,
        price: data.price,
        original_price: data.original_price || null,
        category: data.category,
        image_url: data.image_url || null,
        sizes: data.sizes,
        colors: data.colors,
        in_stock: data.in_stock,
        featured: data.featured,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
      toast.success('Product updated successfully!');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      original_price: null,
      category: 'gents',
      image_url: '',
      sizes: [],
      colors: [],
      in_stock: true,
      featured: false,
    });
    setEditingProduct(null);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: result.data });
    } else {
      createProduct.mutate(result.data);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      original_price: product.original_price,
      category: product.category as 'gents' | 'ladies' | 'kids',
      image_url: product.image_url || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      in_stock: product.in_stock,
      featured: product.featured,
    });
    setIsDialogOpen(true);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (storeLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Loading your store...</p>
        </div>
      </Layout>
    );
  }

  if (!store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Store Found</h1>
          <p className="text-muted-foreground mb-4">You haven't registered a store yet.</p>
          <Button asChild>
            <Link to="/register-store">Register Your Store</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (store.status !== 'approved') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Store Pending Approval</h1>
          <p className="text-muted-foreground mb-4">
            Your store "{store.name}" is currently {store.status}. 
            You'll be able to add products once it's approved.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">{store.name}</h1>
            <p className="text-muted-foreground">Manage your products</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Classic Cotton T-Shirt"
                    />
                    {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: 'gents' | 'ladies' | 'kids') => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gents">Gents</SelectItem>
                        <SelectItem value="ladies">Ladies</SelectItem>
                        <SelectItem value="kids">Kids</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product..."
                    rows={3}
                  />
                  {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (KES) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                    {formErrors.price && <p className="text-sm text-destructive">{formErrors.price}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_price">Original Price (optional)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.original_price || ''}
                      onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || null })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formErrors.image_url && <p className="text-sm text-destructive">{formErrors.image_url}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sizes">Sizes (comma-separated)</Label>
                    <Input
                      id="sizes"
                      value={formData.sizes.join(', ')}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colors">Colors (comma-separated)</Label>
                    <Input
                      id="colors"
                      value={formData.colors.join(', ')}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Black, White, Navy"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <Label htmlFor="in_stock">In Stock</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured">Featured</Label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {productsLoading ? (
          <p>Loading products...</p>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <div className="aspect-square bg-muted relative overflow-hidden rounded-t-lg">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <span className="text-muted-foreground font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">KES {product.price.toLocaleString()}</p>
                      {product.original_price && (
                        <p className="text-sm text-muted-foreground line-through">
                          KES {product.original_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          deleteProduct.mutate(product.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products yet</h2>
            <p className="text-muted-foreground mb-4">Start adding products to your store!</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
}
