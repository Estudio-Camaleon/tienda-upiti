CREATE TABLE public.store_config (
  id BIGINT NOT NULL DEFAULT 1,
  store_name TEXT NOT NULL DEFAULT 'Upiti',
  logo_url TEXT DEFAULT '/media/logo/logo_upiti.svg',
  whatsapp_number TEXT DEFAULT '',
  currency TEXT DEFAULT '$',
  hero_image TEXT DEFAULT 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070',
  main_color TEXT DEFAULT '#ed355d',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT store_config_pkey PRIMARY KEY (id),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.store_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer store_config"
  ON public.store_config
  FOR SELECT
  USING (true);

CREATE POLICY "Solo admin puede modificar store_config"
  ON public.store_config
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );
