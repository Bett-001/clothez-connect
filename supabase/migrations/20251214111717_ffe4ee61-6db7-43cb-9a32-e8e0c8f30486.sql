-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  original_price decimal(10,2),
  category text NOT NULL CHECK (category IN ('gents', 'ladies', 'kids')),
  image_url text,
  images text[] DEFAULT '{}',
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_category ON public.products(category);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Anyone can view products from approved stores
CREATE POLICY "Anyone can view products from approved stores"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.status = 'approved'
  )
);

-- Store owners can insert products for their own stores
CREATE POLICY "Store owners can insert products"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.owner_id = auth.uid()
    AND stores.status = 'approved'
  )
);

-- Store owners can update their own products
CREATE POLICY "Store owners can update their products"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Store owners can delete their own products
CREATE POLICY "Store owners can delete their products"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));