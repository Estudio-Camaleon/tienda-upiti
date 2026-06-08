ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Productos aprobados visibles para todos" ON public.products;
CREATE POLICY "Productos aprobados visibles para todos" ON public.products
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Vendedores ven sus propios productos" ON public.products;
CREATE POLICY "Vendedores ven sus propios productos" ON public.products
  FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Admins ven todos los productos" ON public.products;
CREATE POLICY "Admins ven todos los productos" ON public.products
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Vendedores crean sus productos" ON public.products;
CREATE POLICY "Vendedores crean sus productos" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Vendedores actualizan sus productos" ON public.products;

DROP POLICY IF EXISTS "Admins actualizan cualquier producto" ON public.products;
CREATE POLICY "Admins actualizan cualquier producto" ON public.products
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admins eliminan cualquier producto" ON public.products;
CREATE POLICY "Admins eliminan cualquier producto" ON public.products
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Vendedores eliminan sus propios productos" ON public.products;
CREATE POLICY "Vendedores eliminan sus propios productos" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);
