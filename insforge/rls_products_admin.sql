-- =============================================================================
-- VOLERA: صلاحيات المشرف لجدولي products و product_images (Row Level Security)
-- =============================================================================
-- نفّذ هذا الملف في InsForge → SQL (أو أي لوحة PostgreSQL متوافقة مع Supabase).
-- الخطأ: "new row violates row-level security policy for table 'products'"
-- يعني أن سياسات INSERT/UPDATE غير مفعّلة للمستخدم المسجّل كمشرف.
--
-- شرط: سجل المستخدم في volera_profiles يجب أن يكون role = 'admin' و account_status = 'active'
-- (انظر تعليقات src/lib/profileApi.ts).
-- =============================================================================

-- دالة آمنة تتحقق من دور المشرف (تقرأ volera_profiles بصلاحية المالك لتجاوز RLS على الملفات الشخصية)
CREATE OR REPLACE FUNCTION public.volera_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Supabase / InsForge: معرّف المستخدم من JWT
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.volera_profiles vp
    WHERE vp.id::text = auth.uid()::text
      AND vp.role = 'admin'
      AND vp.account_status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.volera_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.volera_is_admin() TO authenticated;
-- إن كان العميل يستخدم دوراً آخر للمستخدمين المسجلين، أضف: GRANT EXECUTE ... TO anon;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_read_all" ON public.products;

CREATE POLICY "products_select_public"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "products_admin_insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "products_admin_update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "products_admin_delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.volera_is_admin());

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select_public" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_insert" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_all" ON public.product_images;

CREATE POLICY "product_images_select_public"
  ON public.product_images
  FOR SELECT
  USING (true);

CREATE POLICY "product_images_admin_insert"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "product_images_admin_update"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "product_images_admin_delete"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (public.volera_is_admin());

-- =============================================================================
-- إن فشل auth.uid() في بيئتك، راجع وثائق InsForge لاسم الدالة الصحيحة للمعرّف.
-- =============================================================================
