-- Seller profile characteristics, stored as comma-separated text like niche
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS characteristics TEXT;
