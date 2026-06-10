-- Optional stock quantity for products. NULL means seller did not set stock.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER CHECK (stock IS NULL OR stock >= 0);
