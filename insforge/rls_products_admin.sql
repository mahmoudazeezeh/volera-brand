-- =============================================================================
-- VOLERA: صلاحيات المشرف لجدولي products و product_images (Row Level Security)
-- =============================================================================
-- نفّذ هذا الملف في InsForge → SQL (أو أي لوحة PostgreSQL متوافقة مع Supabase).
-- الخطأ: "new row violates row-level security policy for table 'products'"
-- يعني أن سياسات INSERT/UPDATE غير مفعّلة للمستخدم المسجّل كمشرف.
--
-- المشرف يُعتبر مسموحاً إذا تحقق أحد الشرطين (مثل src/context/AuthContext + src/config/volera.ts):
-- 1) البريد في JWT يطابق ADMIN_EMAIL (السطر volera_admin_email أدناه — حدّثه عند تغيير البريد في volera.ts)
-- 2) أو سجل volera_profiles: role = 'admin' وحالة حساب نشطة أو قيد التحقق
-- =============================================================================

-- دالة آمنة تتحقق من دور المشرف (تقرأ volera_profiles بصلاحية المالك لتجاوز RLS على الملفات الشخصية)
CREATE OR REPLACE FUNCTION public.volera_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  volera_admin_email constant text := 'mahmmoadaziza@gmail.com';
  claim_email text;
BEGIN
  -- بدون مستخدم JWT لا يُسمح بعمليات المشرف
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- مطابقة لوحة التحكم: نفس البريد الافتراضي للمشرف في التطبيق (ADMIN_EMAIL)
  claim_email := lower(trim(coalesce(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user' ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    ''
  )));
  IF claim_email <> '' AND claim_email = lower(trim(volera_admin_email)) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.volera_profiles vp
    WHERE vp.id::text = auth.uid()::text
      AND vp.role = 'admin'
      AND vp.account_status IN ('active', 'pending_verification')
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

-- بدون TO: تطبّق على أي دور يُرسل الطلب؛ WITH CHECK يمنع غير المشرف (auth.uid() فارغ = رفض)
CREATE POLICY "products_admin_insert"
  ON public.products
  FOR INSERT
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "products_admin_update"
  ON public.products
  FOR UPDATE
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "products_admin_delete"
  ON public.products
  FOR DELETE
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
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "product_images_admin_update"
  ON public.product_images
  FOR UPDATE
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "product_images_admin_delete"
  ON public.product_images
  FOR DELETE
  USING (public.volera_is_admin());

-- =============================================================================
-- إن فشل auth.uid() في بيئتك، راجع وثائق InsForge لاسم الدالة الصحيحة للمعرّف.
-- =============================================================================
