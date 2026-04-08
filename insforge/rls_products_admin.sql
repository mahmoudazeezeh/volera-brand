-- =============================================================================
-- VOLERA — Row Level Security (InsForge PostgREST / PostgreSQL 15)
-- =============================================================================
-- نفّذ الملف كاملاً في InsForge → SQL.
--
-- يعتمد على: request.jwt.claims (PostgREST). إن فشل استخراج sub/email تُرفض صلاحيات
-- المشرف — لذلك نجمع عدة أشكال شائعة (InsForge / Supabase-like).
--
-- الجداول: products, product_images, delivery_zones, orders, order_items,
--           volera_profiles  (+ hero_slides عبر hero_slides.sql لاحقاً)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- auth.uid() قد لا يكون متوفراً أو قد يرمي استثناء في بعض إعدادات InsForge؛
-- لا نسمح بأن يكسر ذلك كامل دالة المشرف.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.volera_safe_auth_uid()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN NULLIF(trim(auth.uid()::text), '');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- مطالبات JWT: دعم JSON مباشر أو سلسلة JSON داخل jsonb (تشفير مزدوج نادر)
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
  claims jsonb;
BEGIN
  raw := current_setting('request.jwt.claims', true);
  IF raw IS NULL OR btrim(raw) = '' THEN
    RETURN '{}'::jsonb;
  END IF;
  claims := raw::jsonb;
  IF jsonb_typeof(claims) = 'string' THEN
    BEGIN
      claims := (claims #>> '{}')::jsonb;
    EXCEPTION WHEN OTHERS THEN
      RETURN '{}'::jsonb;
    END;
  END IF;
  RETURN claims;
EXCEPTION WHEN OTHERS THEN
  RETURN '{}'::jsonb;
END;
$$;

-- ---------------------------------------------------------------------------
-- معرّف المستخدم من الجلسة (sub، auth.uid، أو حقول متداخلة شائعة)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.volera_requesting_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  sub text;
  u text;
BEGIN
  u := public.volera_safe_auth_uid();
  IF u IS NOT NULL THEN
    RETURN u;
  END IF;

  -- PostgREST يضع أحياناً كل claim في GUC منفصل (مثل request.jwt.claim.sub)
  BEGIN
    sub := NULLIF(trim(current_setting('request.jwt.claim.sub', true)), '');
    IF sub IS NOT NULL THEN
      RETURN sub;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  claims := public.volera_jwt_claims();

  sub := NULLIF(trim(claims ->> 'sub'), '');
  IF sub IS NOT NULL THEN
    RETURN sub;
  END IF;

  sub := NULLIF(trim(claims #>> '{user,id}'), '');
  IF sub IS NOT NULL THEN RETURN sub; END IF;

  sub := NULLIF(trim(claims #>> '{userId}'), '');
  IF sub IS NOT NULL THEN RETURN sub; END IF;

  sub := NULLIF(trim(claims #>> '{user_id}'), '');
  IF sub IS NOT NULL THEN RETURN sub; END IF;

  sub := NULLIF(trim(claims #>> '{app_metadata,sub}'), '');
  IF sub IS NOT NULL THEN RETURN sub; END IF;

  RETURN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- مقارنة id الملف الشخصي مع JWT (UUID مع/بدون شرطات، حالة الأحرف)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.volera_profile_id_matches(profile_id text, jwt_uid text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(trim(lower(replace(coalesce(profile_id, ''), '-', ''))), '')
      = NULLIF(trim(lower(replace(coalesce(jwt_uid, ''), '-', ''))), '')
    AND NULLIF(trim(lower(replace(coalesce(jwt_uid, ''), '-', ''))), '') IS NOT NULL;
$$;

-- ---------------------------------------------------------------------------
-- المشرف — SECURITY DEFINER لقراءة volera_profiles رغم RLS على الجدول
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
  jwt_role text;
  email_from_setting text;
BEGIN
  BEGIN
    jwt_role := lower(trim(coalesce(current_setting('request.jwt.claim.role', true), '')));
    IF jwt_role = 'project_admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  claims := public.volera_jwt_claims();

  jwt_role := lower(trim(coalesce(claims ->> 'role', '')));
  IF jwt_role = 'project_admin' THEN
    RETURN true;
  END IF;

  uid := public.volera_requesting_user_id();
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  BEGIN
    email_from_setting := lower(trim(coalesce(current_setting('request.jwt.claim.email', true), '')));
  EXCEPTION WHEN OTHERS THEN
    email_from_setting := '';
  END;

  claim_email := email_from_setting;
  IF claim_email = '' THEN
    claim_email := lower(trim(coalesce(
      claims ->> 'email',
      claims #>> '{user,email}',
      claims -> 'user' ->> 'email',
      claims -> 'user' ->> 'Email',
      claims -> 'user_metadata' ->> 'email',
      claims -> 'app_metadata' ->> 'email',
      ''
    )));
  END IF;

  IF claim_email <> '' AND claim_email = lower(trim(volera_admin_email)) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.volera_profiles vp
    WHERE vp.role = 'admin'
      AND vp.account_status IN ('active', 'pending_verification')
      AND public.volera_profile_id_matches(vp.id::text, uid)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.volera_safe_auth_uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.volera_jwt_claims() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.volera_requesting_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.volera_profile_id_matches(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.volera_is_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.volera_safe_auth_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.volera_jwt_claims() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.volera_requesting_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.volera_profile_id_matches(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.volera_is_admin() TO authenticated, anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'project_admin') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.volera_safe_auth_uid() TO project_admin';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.volera_jwt_claims() TO project_admin';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.volera_requesting_user_id() TO project_admin';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.volera_profile_id_matches(text, text) TO project_admin';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.volera_is_admin() TO project_admin';
  END IF;
END
$$;

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
-- delivery_zones
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
-- orders
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
-- order_items (تخطّي تلقائياً إن لم يوجد الجدول)
-- =============================================================================
DO $$
BEGIN
  IF to_regclass('public.order_items') IS NULL THEN
    RAISE NOTICE 'تخطّي order_items: الجدول غير موجود';
    RETURN;
  END IF;
  EXECUTE 'ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "order_items_insert_checkout" ON public.order_items';
  EXECUTE 'DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items';
  EXECUTE 'DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items';

  EXECUTE $p$
    CREATE POLICY "order_items_insert_checkout"
      ON public.order_items FOR INSERT WITH CHECK (true)
  $p$;

  EXECUTE $p$
    CREATE POLICY "order_items_select_admin"
      ON public.order_items FOR SELECT USING (public.volera_is_admin())
  $p$;

  EXECUTE $p$
    CREATE POLICY "order_items_delete_admin"
      ON public.order_items FOR DELETE USING (public.volera_is_admin())
  $p$;
END
$$;

-- =============================================================================
-- volera_profiles — مطابقة المالك مع تطبيع id مثل دالة المشرف
-- =============================================================================
ALTER TABLE public.volera_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volera_profiles_insert_own" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_insert_admin" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_select_own_or_admin" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_update_own_or_admin" ON public.volera_profiles;
DROP POLICY IF EXISTS "volera_profiles_delete_admin" ON public.volera_profiles;

CREATE POLICY "volera_profiles_insert_own"
  ON public.volera_profiles FOR INSERT
  WITH CHECK (public.volera_profile_id_matches(id::text, public.volera_requesting_user_id()));

CREATE POLICY "volera_profiles_insert_admin"
  ON public.volera_profiles FOR INSERT WITH CHECK (public.volera_is_admin());

CREATE POLICY "volera_profiles_select_own_or_admin"
  ON public.volera_profiles FOR SELECT
  USING (
    public.volera_profile_id_matches(id::text, public.volera_requesting_user_id())
    OR public.volera_is_admin()
  );

CREATE POLICY "volera_profiles_update_own_or_admin"
  ON public.volera_profiles FOR UPDATE
  USING (
    public.volera_profile_id_matches(id::text, public.volera_requesting_user_id())
    OR public.volera_is_admin()
  )
  WITH CHECK (
    public.volera_profile_id_matches(id::text, public.volera_requesting_user_id())
    OR public.volera_is_admin()
  );

-- =============================================================================
-- 1) وافق volera_admin_email مع src/config/volera.ts (ADMIN_EMAIL)
-- 2) أو: UPDATE public.volera_profiles SET role='admin', account_status='active'
--    WHERE public.volera_profile_id_matches(id::text, '<sub من JWT>');
-- 3) ثم insforge/hero_slides.sql
-- =============================================================================
