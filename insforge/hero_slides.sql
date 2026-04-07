-- نفّذ هذا في InsForge → SQL مرة واحدة لتمكين سلايدر الصفحة الرئيسية
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url text NOT NULL,
  headline_ar text,
  subline_ar text,
  cta_label_ar text DEFAULT 'اكتشف المجموعة',
  cta_href text DEFAULT '#products',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hero_slides_public_read ON public.hero_slides;
DROP POLICY IF EXISTS hero_slides_admin_all ON public.hero_slides;

CREATE POLICY hero_slides_public_read ON public.hero_slides
  FOR SELECT USING (active = true);

CREATE POLICY hero_slides_admin_all ON public.hero_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.volera_profiles vp
      WHERE vp.id = auth.uid()::text AND vp.role = 'admin'
    )
  );

-- إدراج افتراضي (اختياري — نفّذ مرة واحدة إن كان الجدول فارغاً؛ المسارات من مجلد public في الموقع)
-- إن وُجدت شرائح قديمة، احذفها أو حدّث image_url يدوياً.
INSERT INTO public.hero_slides (image_url, headline_ar, subline_ar, cta_label_ar, sort_order)
VALUES
  (
    '/hero/volera-slide-vault.png',
    'عالم يُفتح للأناقة فقط',
    'خزنة الأسرار — حيث يلتقي الذهبيّ بالظلال والفخامة',
    'اكتشف المجموعة',
    0
  ),
  (
    '/hero/volera-slide-bottle.png',
    'فولـيرا',
    'لمسة ذهبية على عبقٍ لا يُنسى — رائحة تتجاوز الكلمات',
    'تسوق العطور',
    1
  );
