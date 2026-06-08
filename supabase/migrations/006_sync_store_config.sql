-- Ensure store_config has the expected columns used by the app
ALTER TABLE public.store_config
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '/media/logo/logo_upiti.svg',
  ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT '$'::text,
  ADD COLUMN IF NOT EXISTS hero_image text DEFAULT './media/portadas/portada_upiti.webp',
  ADD COLUMN IF NOT EXISTS main_color text DEFAULT '#ed355d'::text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS logo_image text DEFAULT './media/logo/icono_upiti.webp'::text;

-- Ensure single-row constraint (id = 1) exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_config' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.store_config ADD COLUMN id bigint NOT NULL DEFAULT 1;
    ALTER TABLE public.store_config ADD CONSTRAINT store_config_pkey PRIMARY KEY (id);
  END IF;
  -- Ensure the table has the single-row check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'store_config' AND c.conname = 'single_row'
  ) THEN
    BEGIN
      ALTER TABLE public.store_config DROP CONSTRAINT IF EXISTS single_row;
      ALTER TABLE public.store_config ADD CONSTRAINT single_row CHECK (id = 1);
    EXCEPTION WHEN undefined_table THEN
      -- ignore
      NULL;
    END;
  END IF;
END$$;
