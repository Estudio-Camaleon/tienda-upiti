-- 014_multiple_images.sql
-- Add JSONB column for multiple product images (up to 3 photos + 1 GIF)

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Migrate existing single images to the images array
UPDATE public.products 
SET images = jsonb_build_array(image) 
WHERE image IS NOT NULL AND (images IS NULL OR images = '[]'::jsonb);

-- Ensure any product without image has empty array
UPDATE public.products 
SET images = '[]'::jsonb 
WHERE images IS NULL;
