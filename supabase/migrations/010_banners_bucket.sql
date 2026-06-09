INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('banners', 'banners', true, false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lectura pública banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Usuarios suben su banner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banners' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios actualizan su banner" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banners' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios eliminan su banner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banners' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
