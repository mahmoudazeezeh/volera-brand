-- =============================================================================
-- VOLERA — Row Level Security للوحة التحكم + المتجر (InsForge / PostgREST)
-- =============================================================================
-- نفّذ هذا الملف كاملاً في InsForge → SQL بعد إنشاء الجداول.
--
-- يغطّي: products, product_images, delivery_zones, orders, order_items,
--         volera_profiles
-- الهيرو: بعد هذا الملف نفّذ insforge/hero_slides.sql (يعتمد على volera_is_admin).
--
-- المشرف: volera_is_admin() — JWT ‎sub‎ أو ‎auth.uid()‎ + (بريد ADMIN أو role في volera_profiles)
-- الطلبات الضيف: INSERT على orders و order_items مسموح للجميع (WITH CHECK true)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- مطالبات JWT (InsForge يضع ‎request.jwt.claims‎)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.volera_jwt_claims()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  raw text;
BEGIN
  raw := current_setting('request.jwt.claims', true);
  IF raw IS NULL OR btrim(raw) = '' THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN raw::jsonb;
EXCEPTION WHEN OTHERS THEN
  RETURN '{}'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.volera_requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT NULLIF(
    trim(
      COALESCE(
        NULLIF(auth.uid()::text, ''),
        NULLIF(public.volera_jwt_claims()->>'sub', '')
      )
    ),
    ''
  );
$$;

-- ---------------------------------------------------------------------------
-- المشرف (SECURITY DEFINER — يقرأ volera_profiles متجاهلاً RLS على الملفات)
-- ---------------------------------------------------------------------------
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
  uid text;
  claims jsonb;
BEGIN
  uid := public.volera_requesting_user_id();
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  claims := public.volera_jwt_claims();

  claim_email := lower(trim(coalesce(
    claims->>'email',
    claims #>> '{user,email}',
    claims->'user_metadata'->>'email',
    claims->'app_metadata'->>'email',
    ''
  )));
  IF claim_email <> '' AND claim_email = lower(trim(volera_admin_email)) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.volera_profiles vp
    WHERE vp.id::text = uid
      AND vp.role = 'admin'
      AND vp.account_status IN ('active', 'pending_verification')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.volera_jwt_claims() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.volera_requesting_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.volera_is_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.volera_jwt_claims() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.volera_requesting_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.volera_is_admin() TO authenticated, anon;

-- =============================================================================
-- products
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_read_all" ON public.products;

CREATE POLICY "products_select_public"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "products_admin_insert"
  ON public.products FOR INSERT WITH CHECK (public.volera_is_admin());

CREATE POLICY "products_admin_update"
  ON public.products FOR UPDATE
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "products_admin_delete"
  ON public.products FOR DELETE USING (public.volera_is_admin());

-- =============================================================================
-- product_images
-- =============================================================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select_public" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_insert" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_all" ON public.product_images;

CREATE POLICY "product_images_select_public"
  ON public.product_images FOR SELECT USING (true);

CREATE POLICY "product_images_admin_insert"
  ON public.product_images FOR INSERT WITH CHECK (public.volera_is_admin());

CREATE POLICY "product_images_admin_update"
  ON public.product_images FOR UPDATE
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "product_images_admin_delete"
  ON public.product_images FOR DELETE USING (public.volera_is_admin());

-- =============================================================================
-- delivery_zones — قراءة للمتجر (نشط) + إدارة كاملة للمشرف
-- =============================================================================
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_zones_select_public" ON public.delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_insert_admin" ON public.delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_update_admin" ON public.delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_delete_admin" ON public.delivery_zones;
DROP POLICY IF EXISTS "delivery_zones_admin_all" ON public.delivery_zones;

CREATE POLICY "delivery_zones_select_public"
  ON public.delivery_zones FOR SELECT
  USING (active = true OR public.volera_is_admin());

CREATE POLICY "delivery_zones_insert_admin"
  ON public.delivery_zones FOR INSERT WITH CHECK (public.volera_is_admin());

CREATE POLICY "delivery_zones_update_admin"
  ON public.delivery_zones FOR UPDATE
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

CREATE POLICY "delivery_zones_delete_admin"
  ON public.delivery_zones FOR DELETE USING (public.volera_is_admin());

-- =============================================================================
-- orders — إنشاء طلب للجميع (ضيف)؛ عرض وتعديل للمشرف فقط
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_insert_checkout" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;

CREATE POLICY "orders_insert_checkout"
  ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_select_admin"
  ON public.orders FOR SELECT USING (public.volera_is_admin());

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.volera_is_admin())
  WITH CHECK (public.volera_is_admin());

-- =============================================================================
-- order_items — إدراج مع الطلب؛ قراءة/حذف للمشرف (صيانة)
-- =============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_insert_checkout" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

CREATE POLICY "order_items_insert_checkout"
  ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_select_admin"
  ON public.order_items FOR SELECT USING (public.volera_is_admin());

CREATE POLICY "order_items_delete_admin"
  ON public.order_items FOR DELETE USING (public.volera_is_admin());

-- =============================================================================
-- volera_profiles — المستخدم يسجّل ملفه؛ المشرف يرى الجميع (إحصائيات)
-- =============================================================================
ALTER TABLE public.volera_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volera_profiles_insert_own" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_insert_admin" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_select_own_or_admin" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_update_own_or_admin" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_delete_admin" ON public.volera_profiles;

CREATE POLICY "volera_profiles_insert_own"
  ON public.volera_profiles FOR INSERT
  WITH CHECK (id::text = public.volera_requesting_user_id());

CREATE POLICY "volera_profiles_insert_admin"
  ON public.volera_profiles FOR INSERT WITH CHECK (public.volera_is_admin());

CREATE POLICY "volera_profiles_select_own_or_admin"
  ON public.volera_profiles FOR SELECT
  USING (
    id::text = public.volera_requesting_user_id()
    OR public.volera_is_admin()
  );

CREATE POLICY "volera_profiles_update_own_or_admin"
  ON public.volera_profiles FOR UPDATE
  USING (
    id::text = public.volera_requesting_user_id()
    OR public.volera_is_admin()
  )
  WITH CHECK (
    id::text = public.volera_requesting_user_id()
    OR public.volera_is_admin()
  );

-- =============================================================================
-- تحقق يدوي بعد التنفيذ:
-- 1) حدّث volera_admin_email أعلاه إن اختلف عن src/config/volera.ts (ADMIN_EMAIL)
-- 2) UPDATE public.volera_profiles SET role='admin', account_status='active'
--    WHERE lower(email) = lower('بريدك');
-- 3) نفّذ insforge/hero_slides.sql لسلايدر لوحة التحكم
-- =============================================================================
