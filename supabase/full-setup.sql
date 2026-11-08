-- Clotz Hub: full database setup for a NEW, EMPTY Supabase project.
-- Paste this whole file into the Supabase SQL editor and click Run.
-- It runs every migration in supabase/migrations in order.
-- Do NOT run it on a database that already has these tables.


-- ====================================================================
-- 20251214073338_5a5c3c04-4f17-485a-b2d1-b42c02437b50.sql
-- ====================================================================
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on auth signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 20251214074117_8b4577aa-4f5a-4339-9389-8b8a58854c4a.sql
-- ====================================================================
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'store_owner', 'user');

-- Create enum for store status
CREATE TYPE public.store_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  location TEXT,
  phone TEXT,
  email TEXT,
  status store_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Stores RLS policies
CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Owners can view their own stores"
ON public.stores
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all stores"
ON public.stores
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can register stores"
ON public.stores
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own stores"
ON public.stores
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can update any store"
ON public.stores
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on stores
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically add store_owner role when store is approved
CREATE OR REPLACE FUNCTION public.handle_store_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_id, 'store_owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for store approval
CREATE TRIGGER on_store_approved
AFTER UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_approval();

-- ====================================================================
-- 20251214111155_15a10255-4278-40ec-820f-737a611031fc.sql
-- ====================================================================
-- Drop the existing public policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;

-- Create a view for public store information (excluding sensitive contact data)
CREATE OR REPLACE VIEW public.public_stores AS
SELECT 
  id,
  name,
  description,
  logo_url,
  banner_url,
  location,
  status,
  created_at,
  updated_at
FROM public.stores
WHERE status = 'approved';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- Create a new policy for approved stores that only shows non-sensitive columns
-- Admins and owners still have full access through their existing policies
CREATE POLICY "Public can view approved stores basic info"
ON public.stores
FOR SELECT
TO anon
USING (status = 'approved');

-- Ensure authenticated users who are not admin/owner can also see basic store info
CREATE POLICY "Authenticated can view approved stores basic info"
ON public.stores
FOR SELECT
TO authenticated
USING (
  status = 'approved' 
  AND NOT has_role(auth.uid(), 'admin') 
  AND auth.uid() != owner_id
);

-- ====================================================================
-- 20251214111211_463c8e3e-c2a4-4e4e-94c3-4af8500fc6b0.sql
-- ====================================================================
-- Drop the security definer view (causing the linter warning)
DROP VIEW IF EXISTS public.public_stores;

-- The existing policies now properly restrict access:
-- - Admins can view ALL columns through "Admins can view all stores"
-- - Owners can view ALL columns of their stores through "Owners can view their own stores"
-- - Public/authenticated non-admin/non-owner can view approved stores but we'll handle column restriction in the application layer

-- Actually, let's create a secure function to get public store data instead
CREATE OR REPLACE FUNCTION public.get_public_stores()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  banner_url text,
  location text,
  status store_status,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    description,
    logo_url,
    banner_url,
    location,
    status,
    created_at,
    updated_at
  FROM public.stores
  WHERE status = 'approved'
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_stores() TO anon, authenticated;

-- ====================================================================
-- 20251214111717_ffe4ee61-6db7-43cb-9a32-e8e0c8f30486.sql
-- ====================================================================
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

-- ====================================================================
-- 20261108120000_marketplace_orders_and_store_details.sql
-- ====================================================================
-- =====================================================================
-- Clotz Hub marketplace: richer store profiles, product stock,
-- orders, store reviews and media uploads.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Store profile fields
-- ---------------------------------------------------------------------
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS map_url TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS offers_delivery BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS offers_pickup BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS mpesa_till TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_paybill TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_account TEXT,
  ADD COLUMN IF NOT EXISTS accepts_cash BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_categories_check
  CHECK (categories <@ ARRAY['gents','ladies','kids']::text[]);

-- ---------------------------------------------------------------------
-- 2. Product fields: stock, type, brand, material, visibility
-- ---------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  ADD COLUMN IF NOT EXISTS product_type TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Existing products that were marked in stock get a starting quantity.
UPDATE public.products SET stock = CASE WHEN in_stock THEN 10 ELSE 0 END;

-- in_stock is now derived from the stock count.
CREATE OR REPLACE FUNCTION public.sync_product_in_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.in_stock := NEW.stock > 0;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_products_in_stock
BEFORE INSERT OR UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_in_stock();

CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- Shoppers only see active products; owners always see their own.
DROP POLICY IF EXISTS "Anyone can view products from approved stores" ON public.products;

CREATE POLICY "Anyone can view active products from approved stores"
ON public.products
FOR SELECT
USING (
  is_active
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.status = 'approved'
  )
);

CREATE POLICY "Store owners can view their products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- 3. Profile defaults used to prefill checkout
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_address TEXT,
  ADD COLUMN IF NOT EXISTS default_city TEXT;

-- ---------------------------------------------------------------------
-- 4. Orders
-- ---------------------------------------------------------------------
CREATE TYPE public.order_status AS ENUM
  ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TYPE public.payment_status AS ENUM
  ('unpaid', 'pending_verification', 'paid', 'failed', 'refunded');

CREATE TYPE public.payment_method AS ENUM ('mpesa', 'cash');

CREATE TYPE public.fulfillment_method AS ENUM ('delivery', 'pickup');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE
    DEFAULT ('CH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_reference TEXT,
  fulfillment_method public.fulfillment_method NOT NULL DEFAULT 'delivery',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  notes TEXT,
  store_notes TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_store ON public.orders(store_id, created_at DESC);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  size TEXT,
  color TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their orders"
ON public.orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Store owners can view their store orders"
ON public.orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Store owners can update their store orders"
ON public.orders FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Admins can update all orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Orders are only created through place_orders(), so there is no INSERT policy.

CREATE POLICY "Order items follow order visibility"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
    AND (
      o.customer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = o.store_id AND s.owner_id = auth.uid()
      )
    )
));

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keep money and ownership fields fixed once an order exists,
-- and never re-open a cancelled order (its stock was already returned).
CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'A cancelled order cannot be re-opened';
  END IF;
  NEW.order_number := OLD.order_number;
  NEW.customer_id := OLD.customer_id;
  NEW.store_id := OLD.store_id;
  NEW.subtotal := OLD.subtotal;
  NEW.delivery_fee := OLD.delivery_fee;
  NEW.total := OLD.total;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_orders_update
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

-- Return stock to the store when an order is cancelled.
CREATE OR REPLACE FUNCTION public.restock_cancelled_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p
    SET stock = p.stock + oi.qty
    FROM (
      SELECT product_id, SUM(quantity) AS qty
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
      GROUP BY product_id
    ) oi
    WHERE p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER restock_orders_on_cancel
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restock_cancelled_order();

-- ---------------------------------------------------------------------
-- 5. Checkout: place one order per store from the cart
--    Prices, delivery fees and stock come from the database, not the client.
--    _items: [{ "product_id": uuid, "quantity": int, "size": text, "color": text }]
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_orders(
  _items JSONB,
  _customer_name TEXT,
  _customer_phone TEXT,
  _customer_email TEXT,
  _fulfillment_method public.fulfillment_method,
  _delivery_address TEXT,
  _delivery_city TEXT,
  _notes TEXT,
  _payment_method public.payment_method
)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _store public.stores;
  _order public.orders;
  _item JSONB;
  _product public.products;
  _qty INTEGER;
  _subtotal NUMERIC(10,2);
  _fee NUMERIC(10,2);
  _lines JSONB;
  _requested_ids UUID[];
  _found_count INTEGER;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to place an order';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;
  IF coalesce(trim(_customer_name), '') = '' OR coalesce(trim(_customer_phone), '') = '' THEN
    RAISE EXCEPTION 'Name and phone number are required';
  END IF;
  IF _fulfillment_method = 'delivery' AND coalesce(trim(_delivery_address), '') = '' THEN
    RAISE EXCEPTION 'A delivery address is required';
  END IF;

  SELECT array_agg(DISTINCT (e->>'product_id')::uuid)
  INTO _requested_ids
  FROM jsonb_array_elements(_items) e;

  SELECT count(*) INTO _found_count
  FROM public.products WHERE id = ANY(_requested_ids);

  IF _found_count <> coalesce(array_length(_requested_ids, 1), 0) THEN
    RAISE EXCEPTION 'Some items in your cart are no longer available. Please review your cart.';
  END IF;

  FOR _store IN
    SELECT s.* FROM public.stores s
    WHERE s.id IN (SELECT p.store_id FROM public.products p WHERE p.id = ANY(_requested_ids))
    ORDER BY s.name
  LOOP
    IF _store.status <> 'approved' THEN
      RAISE EXCEPTION '% is not accepting orders right now', _store.name;
    END IF;
    IF _fulfillment_method = 'delivery' AND NOT _store.offers_delivery THEN
      RAISE EXCEPTION '% does not offer delivery. Choose pickup instead.', _store.name;
    END IF;
    IF _fulfillment_method = 'pickup' AND NOT _store.offers_pickup THEN
      RAISE EXCEPTION '% does not offer in-store pickup. Choose delivery instead.', _store.name;
    END IF;
    IF _payment_method = 'mpesa' AND _store.mpesa_till IS NULL AND _store.mpesa_paybill IS NULL THEN
      RAISE EXCEPTION '% does not accept M-Pesa yet. Choose cash instead.', _store.name;
    END IF;
    IF _payment_method = 'cash' AND NOT _store.accepts_cash THEN
      RAISE EXCEPTION '% does not accept cash. Choose M-Pesa instead.', _store.name;
    END IF;

    _subtotal := 0;
    _lines := '[]'::jsonb;

    FOR _item IN SELECT e FROM jsonb_array_elements(_items) e LOOP
      SELECT * INTO _product
      FROM public.products
      WHERE id = (_item->>'product_id')::uuid
      FOR UPDATE;

      CONTINUE WHEN _product.store_id <> _store.id;

      _qty := (_item->>'quantity')::int;
      IF _qty IS NULL OR _qty < 1 THEN
        RAISE EXCEPTION 'Invalid quantity for %', _product.name;
      END IF;
      IF NOT _product.is_active THEN
        RAISE EXCEPTION '% is no longer available', _product.name;
      END IF;
      IF _product.stock < _qty THEN
        RAISE EXCEPTION 'Only % left of %', _product.stock, _product.name;
      END IF;

      UPDATE public.products SET stock = stock - _qty WHERE id = _product.id;

      _subtotal := _subtotal + _product.price * _qty;
      _lines := _lines || jsonb_build_object(
        'product_id', _product.id,
        'product_name', _product.name,
        'product_image', coalesce(_product.image_url, _product.images[1]),
        'size', nullif(_item->>'size', ''),
        'color', nullif(_item->>'color', ''),
        'unit_price', _product.price,
        'quantity', _qty,
        'line_total', _product.price * _qty
      );
    END LOOP;

    IF _fulfillment_method = 'pickup' THEN
      _fee := 0;
    ELSIF _store.free_delivery_threshold IS NOT NULL AND _subtotal >= _store.free_delivery_threshold THEN
      _fee := 0;
    ELSE
      _fee := _store.delivery_fee;
    END IF;

    INSERT INTO public.orders (
      customer_id, store_id, payment_method, fulfillment_method,
      customer_name, customer_phone, customer_email,
      delivery_address, delivery_city, notes,
      subtotal, delivery_fee, total
    ) VALUES (
      _uid, _store.id, _payment_method, _fulfillment_method,
      trim(_customer_name), trim(_customer_phone), nullif(trim(coalesce(_customer_email, '')), ''),
      CASE WHEN _fulfillment_method = 'delivery' THEN trim(_delivery_address) END,
      CASE WHEN _fulfillment_method = 'delivery' THEN nullif(trim(coalesce(_delivery_city, '')), '') END,
      nullif(trim(coalesce(_notes, '')), ''),
      _subtotal, _fee, _subtotal + _fee
    )
    RETURNING * INTO _order;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, size, color,
      unit_price, quantity, line_total
    )
    SELECT
      _order.id,
      (l->>'product_id')::uuid,
      l->>'product_name',
      l->>'product_image',
      l->>'size',
      l->>'color',
      (l->>'unit_price')::numeric,
      (l->>'quantity')::int,
      (l->>'line_total')::numeric
    FROM jsonb_array_elements(_lines) l;

    RETURN NEXT _order;
  END LOOP;

  -- Remember the shopper's details for next time.
  UPDATE public.profiles
  SET phone = coalesce(nullif(trim(_customer_phone), ''), phone),
      default_address = CASE WHEN _fulfillment_method = 'delivery' THEN trim(_delivery_address) ELSE default_address END,
      default_city = CASE WHEN _fulfillment_method = 'delivery' THEN coalesce(nullif(trim(coalesce(_delivery_city, '')), ''), default_city) ELSE default_city END
  WHERE user_id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.place_orders(JSONB, TEXT, TEXT, TEXT, public.fulfillment_method, TEXT, TEXT, TEXT, public.payment_method) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_orders(JSONB, TEXT, TEXT, TEXT, public.fulfillment_method, TEXT, TEXT, TEXT, public.payment_method) TO authenticated;

-- Customer submits the M-Pesa confirmation code after paying the store.
CREATE OR REPLACE FUNCTION public.submit_payment_reference(_order_id UUID, _reference TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(trim(_reference), '') = '' THEN
    RAISE EXCEPTION 'Enter the M-Pesa confirmation code';
  END IF;

  UPDATE public.orders
  SET payment_reference = upper(trim(_reference)),
      payment_status = 'pending_verification'
  WHERE id = _order_id
    AND customer_id = auth.uid()
    AND payment_method = 'mpesa'
    AND payment_status IN ('unpaid', 'failed')
    AND status <> 'cancelled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This order cannot accept a payment code right now';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payment_reference(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payment_reference(UUID, TEXT) TO authenticated;

-- Customer cancels an order the store has not confirmed yet.
CREATE OR REPLACE FUNCTION public.cancel_order(_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = _order_id
    AND customer_id = auth.uid()
    AND status = 'pending'
    AND payment_status <> 'paid';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only unpaid orders that the store has not confirmed can be cancelled';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- 6. Store reviews (only from customers with a delivered order)
-- ---------------------------------------------------------------------
CREATE TABLE public.store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

CREATE INDEX idx_store_reviews_store ON public.store_reviews(store_id, created_at DESC);

ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read store reviews"
ON public.store_reviews FOR SELECT
USING (true);

CREATE POLICY "Customers with a delivered order can review"
ON public.store_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.store_id = store_reviews.store_id
      AND o.customer_id = auth.uid()
      AND o.status = 'delivered'
  )
);

CREATE POLICY "Reviewers can update their review"
ON public.store_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can delete their review"
ON public.store_reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_store_reviews_updated_at
BEFORE UPDATE ON public.store_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 7. Public store listing with ratings and product counts
--    (business phone and email stay private; WhatsApp is opt-in public)
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_stores();

CREATE OR REPLACE FUNCTION public.get_public_stores()
RETURNS TABLE (
  id UUID,
  name TEXT,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  location TEXT,
  city TEXT,
  address TEXT,
  map_url TEXT,
  categories TEXT[],
  opening_hours TEXT,
  whatsapp TEXT,
  instagram TEXT,
  offers_delivery BOOLEAN,
  offers_pickup BOOLEAN,
  delivery_fee NUMERIC,
  free_delivery_threshold NUMERIC,
  mpesa_till TEXT,
  mpesa_paybill TEXT,
  mpesa_account TEXT,
  accepts_cash BOOLEAN,
  is_featured BOOLEAN,
  status store_status,
  product_count BIGINT,
  avg_rating NUMERIC,
  review_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    s.id, s.name, s.tagline, s.description, s.logo_url, s.banner_url,
    s.location, s.city, s.address, s.map_url, s.categories, s.opening_hours,
    s.whatsapp, s.instagram, s.offers_delivery, s.offers_pickup,
    s.delivery_fee, s.free_delivery_threshold,
    s.mpesa_till, s.mpesa_paybill, s.mpesa_account, s.accepts_cash,
    s.is_featured, s.status,
    (SELECT count(*) FROM public.products p WHERE p.store_id = s.id AND p.is_active),
    (SELECT round(avg(r.rating)::numeric, 1) FROM public.store_reviews r WHERE r.store_id = s.id),
    (SELECT count(*) FROM public.store_reviews r WHERE r.store_id = s.id),
    s.created_at, s.updated_at
  FROM public.stores s
  WHERE s.status = 'approved'
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stores() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Image uploads for store logos, banners and product photos.
--    Each user uploads into a folder named after their user id.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Store media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-media');

CREATE POLICY "Users can upload store media to their folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their store media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their store media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 9. Only admins can approve, reject or feature stores.
--    Owners may resubmit a rejected store for review.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_store_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.rejection_reason := NULL;
    NEW.is_featured := false;
    RETURN NEW;
  END IF;

  NEW.owner_id := OLD.owner_id;
  NEW.is_featured := OLD.is_featured;
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    NEW.rejection_reason := NULL;
  ELSE
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_stores_write
BEFORE INSERT OR UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.guard_store_write();


-- ====================================================================
-- API access for the app (Row Level Security still decides which rows
-- each user can see or change). Some newer Supabase projects do not add
-- these grants automatically.
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
