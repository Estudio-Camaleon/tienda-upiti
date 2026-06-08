INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('avatars', 'avatars', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('products', 'products', true, false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lectura pública avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Usuarios suben su avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios actualizan su avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios eliminan su avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Lectura pública products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Usuarios suben imagenes de productos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios actualizan imagenes de productos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios eliminan imagenes de productos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
