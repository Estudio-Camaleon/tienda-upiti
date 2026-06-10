-- Add specifications JSONB column to products for category-specific fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

-- Add verified_reason to profiles so admins can explain why seller is verified
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_reason TEXT;

-- Update RLS policy so sellers can update their own products (including specifications)
DROP POLICY IF EXISTS "Vendedores actualizan sus productos" ON public.products;
CREATE POLICY "Vendedores actualizan sus productos" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND status = 'approved');
