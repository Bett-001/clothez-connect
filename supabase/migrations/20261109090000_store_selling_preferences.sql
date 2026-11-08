-- Two quick questions for store owners, asked in the store profile.
--   sells_on_whatsapp : the store takes a lot of orders on WhatsApp (we suggest a WhatsApp inbox tool)
--   wants_mpesa_prompt: the store wants shoppers to pay via an M-Pesa prompt on their phone (STK push)
-- Only the owner and admins can read these (existing stores RLS); they are not in get_public_stores().
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS sells_on_whatsapp BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_mpesa_prompt BOOLEAN NOT NULL DEFAULT false;
