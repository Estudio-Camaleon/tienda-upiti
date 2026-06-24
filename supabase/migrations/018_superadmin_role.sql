-- 018_superadmin_role.sql
-- Add superadmin role above admin. Superadmin can manage other admins.

-- Update RLS policies so superadmin inherits all admin permissions.
-- Replace `role = 'admin'` with `role IN ('admin', 'superadmin')` everywhere.

-- ───── store_config ─────
DROP POLICY IF EXISTS "Solo admin puede modificar store_config" ON public.store_config;
CREATE POLICY "Solo admin puede modificar store_config" ON public.store_config
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin')
    )
  );

-- ───── products ─────
DROP POLICY IF EXISTS "Admins ven todos los productos" ON public.products;
CREATE POLICY "Admins ven todos los productos" ON public.products
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins actualizan cualquier producto" ON public.products;
CREATE POLICY "Admins actualizan cualquier producto" ON public.products
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins eliminan cualquier producto" ON public.products;
CREATE POLICY "Admins eliminan cualquier producto" ON public.products
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin'))
  );

-- ───── reviews ─────
DROP POLICY IF EXISTS "Admins eliminan reviews" ON public.reviews;
CREATE POLICY "Admins eliminan reviews" ON public.reviews
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin'))
  );

-- ───── Cómo promover a superadmin ─────
-- Ejecutar en SQL Editor:
--   UPDATE public.profiles
--   SET role = 'superadmin', is_verified = true
--   WHERE email = 'tu-email@ejemplo.com';
