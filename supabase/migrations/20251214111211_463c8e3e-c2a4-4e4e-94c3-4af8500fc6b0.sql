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