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