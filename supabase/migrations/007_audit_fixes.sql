-- Audit fixes: keep this incremental because older migrations may already be applied remotely.

-- Prevent sellers from approving or otherwise updating their own products directly.
DROP POLICY IF EXISTS "Vendedores actualizan sus productos" ON public.products;

-- Allow the seller dashboard delete button to work for product owners.
DROP POLICY IF EXISTS "Vendedores eliminan sus propios productos" ON public.products;
CREATE POLICY "Vendedores eliminan sus propios productos" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

-- Ensure future store_config rows use absolute public asset paths.
ALTER TABLE public.store_config
  ALTER COLUMN logo_image SET DEFAULT '/media/logo/icono_upiti.webp',
  ALTER COLUMN logo_url SET DEFAULT '/media/logo/logo_upiti.svg',
  ALTER COLUMN hero_image SET DEFAULT '/media/portadas/portada_upiti.webp';

-- Normalize legacy relative paths stored before this migration.
UPDATE public.store_config
SET
  logo_image = CASE
    WHEN logo_image LIKE './media/%' THEN '/' || substring(logo_image FROM 3)
    ELSE logo_image
  END,
  logo_url = CASE
    WHEN logo_url LIKE './media/%' THEN '/' || substring(logo_url FROM 3)
    ELSE logo_url
  END,
  hero_image = CASE
    WHEN hero_image LIKE './media/%' THEN '/' || substring(hero_image FROM 3)
    ELSE hero_image
  END;

-- Avoid broken image src when logo_image was left empty.
UPDATE public.store_config
SET logo_image = '/media/logo/icono_upiti.webp'
WHERE logo_image IS NULL OR trim(logo_image) = '';
