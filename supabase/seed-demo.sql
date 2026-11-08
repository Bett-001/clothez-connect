-- =====================================================================
-- Optional demo data: four approved stores with products.
-- 1. Sign up in the app with the email below (or change it to yours).
-- 2. Run this whole file in the Supabase SQL editor.
-- The demo stores all belong to that account. Delete them any time from
-- the SQL editor with:  DELETE FROM public.stores WHERE name LIKE '% (Demo)';
-- =====================================================================
DO $$
DECLARE
  owner_email TEXT := 'you@example.com';  -- <-- change this
  owner UUID;
  s1 UUID; s2 UUID; s3 UUID; s4 UUID;
BEGIN
  SELECT id INTO owner FROM auth.users WHERE email = owner_email;
  IF owner IS NULL THEN
    RAISE EXCEPTION 'No user with email %. Sign up in the app first.', owner_email;
  END IF;

  INSERT INTO public.stores (owner_id, name, tagline, description, categories, location, city, address, opening_hours,
    phone, email, whatsapp, logo_url, banner_url, delivery_fee, free_delivery_threshold, mpesa_till, status, is_featured)
  VALUES (owner, 'Nairobi Elegance (Demo)', 'African-inspired fashion for him and her',
    'Premium fashion that blends traditional Kenyan textiles with contemporary tailoring. Ankara blazers, silk dresses and statement pieces for weddings, events and the office.',
    '{gents,ladies}', 'Westlands', 'Nairobi', 'Sarit Centre, 2nd floor', E'Mon–Sat: 9:00am – 8:00pm\nSun: 11:00am – 6:00pm',
    '0712345678', 'hello@example.com', '0712345678',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=400&fit=crop',
    300, 10000, '123456', 'approved', true)
  RETURNING id INTO s1;

  INSERT INTO public.stores (owner_id, name, tagline, description, categories, location, city, address, opening_hours,
    phone, email, whatsapp, logo_url, banner_url, delivery_fee, mpesa_till, status)
  VALUES (owner, 'Little Fashionistas (Demo)', 'Durable, playful clothing for kids',
    'Adorable and hard-wearing clothing for children from newborn to 14 years. Quality cotton that survives playtime, plus school uniforms all year round.',
    '{kids}', 'Karen', 'Nairobi', 'The Hub Karen, ground floor', 'Mon–Sun: 10:00am – 7:00pm',
    '0723456789', 'kids@example.com', '0723456789',
    'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1200&h=400&fit=crop',
    250, '234567', 'approved')
  RETURNING id INTO s2;

  INSERT INTO public.stores (owner_id, name, tagline, description, categories, location, city, address, opening_hours,
    phone, email, whatsapp, logo_url, banner_url, delivery_fee, free_delivery_threshold, mpesa_paybill, status)
  VALUES (owner, 'Urban Gent (Demo)', 'Sharp menswear for the city',
    'Contemporary menswear for the urban professional, from tailored suits and crisp shirts to relaxed weekend wear.',
    '{gents}', 'Kilimani', 'Nairobi', 'Yaya Centre, 1st floor', 'Mon–Sat: 9:00am – 7:00pm',
    '0734567890', 'style@example.com', '0734567890',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200&h=400&fit=crop',
    350, 8000, '522522', 'approved')
  RETURNING id INTO s3;

  INSERT INTO public.stores (owner_id, name, tagline, description, categories, location, city, opening_hours,
    phone, email, whatsapp, logo_url, banner_url, offers_delivery, delivery_fee, mpesa_till, status)
  VALUES (owner, 'Mama Afrika Boutique (Demo)', 'Vibrant prints and handcrafted accessories',
    'Celebrating African beauty with kitenge, kikoi and beadwork made by local artisans.',
    '{ladies}', 'Old Town', 'Mombasa', 'Mon–Sat: 8:30am – 6:30pm',
    '0745678901', 'orders@example.com', '0745678901',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
    true, 200, '345678', 'approved')
  RETURNING id INTO s4;

  INSERT INTO public.products (store_id, name, description, price, original_price, category, product_type, material,
    image_url, images, sizes, colors, stock, featured)
  VALUES
    (s1, 'Ankara Print Blazer', 'Traditional Ankara fabric with modern blazer tailoring. Perfect for weddings, events or a statement at the office.',
      8500, 12000, 'gents', 'Suits & Blazers', 'Cotton wax print',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop}',
      '{S,M,L,XL,XXL}', '{Blue/Gold,Red/Black,Green/Yellow}', 15, true),
    (s1, 'Silk Maxi Dress', 'Flowing silk maxi dress with hand-stitched beadwork.',
      6500, NULL, 'ladies', 'Dresses', 'Silk',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop,https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop}',
      '{XS,S,M,L}', '{Emerald,Royal Blue,Burgundy}', 8, true),
    (s2, 'Safari Adventure Set', 'Matching shirt and shorts with safari animal prints. Machine washable.',
      2200, 2800, 'kids', 'T-Shirts & Tops', '100% cotton',
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&h=800&fit=crop}',
      '{2-3Y,3-4Y,4-5Y,5-6Y}', '{Khaki,Navy}', 25, true),
    (s2, 'School Sweater', 'Warm V-neck school sweater that keeps its shape wash after wash.',
      1500, NULL, 'kids', 'School Uniforms', 'Acrylic blend',
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=800&fit=crop}',
      '{5-6Y,7-8Y,9-10Y,11-12Y,13-14Y}', '{Navy,Maroon,Green,Grey}', 60, false),
    (s3, 'Premium Cotton Polo', 'Classic-fit polo in premium cotton for business casual or weekends.',
      3500, NULL, 'gents', 'T-Shirts & Tops', 'Egyptian cotton',
      'https://images.unsplash.com/photo-1625910513413-5fc4e5e80f6f?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1625910513413-5fc4e5e80f6f?w=600&h=800&fit=crop}',
      '{S,M,L,XL,XXL}', '{White,Navy,Black,Olive}', 42, true),
    (s3, 'Slim-fit Chinos', 'Stretch chinos that look sharp from the office to dinner.',
      4200, 4800, 'gents', 'Trousers', 'Cotton stretch twill',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop}',
      '{30,32,34,36,38}', '{Beige,Navy,Olive}', 20, false),
    (s4, 'Kitenge Wrap Skirt', 'Vibrant kitenge wrap skirt with an adjustable waist.',
      3200, NULL, 'ladies', 'Skirts', 'Kitenge cotton',
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop}',
      '{One Size}', '{Pattern A,Pattern B}', 18, false),
    (s4, 'Beaded Collar Necklace', 'Handcrafted Maasai-inspired beaded collar. Each piece is unique.',
      4500, NULL, 'ladies', 'Accessories', 'Glass beads',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop',
      '{https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop}',
      '{}', '{Multi-colour}', 12, true);

  -- The account that owns the demo stores becomes a store owner.
  INSERT INTO public.user_roles (user_id, role) VALUES (owner, 'store_owner') ON CONFLICT DO NOTHING;
END $$;
