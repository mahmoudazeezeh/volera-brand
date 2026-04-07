import { useCallback, useEffect, useState } from 'react';
import {
  deleteHeroSlide,
  fetchAllHeroSlidesAdmin,
  insertHeroSlide,
  updateHeroSlide,
  type HeroSlide,
} from '../../lib/heroSlidesApi';
import { uploadHeroBannerFile } from '../../lib/voleraAdminApi';

export default function HeroSlidesAdminTab({
  onMessage,
}: {
  onMessage: (s: string | null) => void;
}) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [newUrl, setNewUrl] = useState('');
  const [newHeadline, setNewHeadline] = useState('فولـيرا');
  const [newSubline, setNewSubline] = useState('رائحة تتجاوز الكلمات');
  const [newCta, setNewCta] = useState('اكتشف المجموعة');
  const [newHref, setNewHref] = useState('#products');
  const [newOrder, setNewOrder] = useState('0');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchAllHeroSlidesAdmin();
    setLoading(false);
    if (error) {
      onMessage(error.message);
      return;
    }
    setSlides(data);
  }, [onMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUploadNew(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = await uploadHeroBannerFile(f);
    if (!r.ok) onMessage(r.error);
    else {
      setNewUrl(r.url);
      onMessage(null);
    }
  }

  async function addSlide() {
    if (!newUrl.trim()) {
      onMessage('أضف رابط صورة أو ارفع من المعرض');
      return;
    }
    const r = await insertHeroSlide({
      image_url: newUrl.trim(),
      headline_ar: newHeadline.trim() || undefined,
      subline_ar: newSubline.trim() || undefined,
      cta_label_ar: newCta.trim() || undefined,
      cta_href: newHref.trim() || undefined,
      sort_order: Number(newOrder) || 0,
      active: true,
    });
    if (!r.ok) onMessage(r.error);
    else {
      onMessage(null);
      setNewUrl('');
      await load();
    }
  }

  async function saveRow(s: HeroSlide) {
    setBusyId(s.id);
    const r = await updateHeroSlide(s.id, {
      image_url: s.image_url,
      headline_ar: s.headline_ar,
      subline_ar: s.subline_ar,
      cta_label_ar: s.cta_label_ar,
      cta_href: s.cta_href,
      sort_order: s.sort_order,
      active: s.active,
    });
    setBusyId(null);
    if (!r.ok) onMessage(r.error);
    else onMessage(null);
  }

  async function removeRow(id: number) {
    if (!window.confirm('حذف هذه الشريحة؟')) return;
    const r = await deleteHeroSlide(id);
    if (!r.ok) onMessage(r.error);
    else {
      onMessage(null);
      await load();
    }
  }

  function patchSlide(id: number, patch: Partial<HeroSlide>) {
    setSlides((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function replaceImage(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = await uploadHeroBannerFile(f);
    if (!r.ok) onMessage(r.error);
    else {
      patchSlide(id, { image_url: r.url });
      const r2 = await updateHeroSlide(id, { image_url: r.url });
      if (!r2.ok) onMessage(r2.error);
      else onMessage(null);
    }
  }

  return (
    <div className="space-y-10">
      <div className="glass-strong rounded-2xl p-6 max-w-3xl space-y-4">
        <h2 className="text-xl font-bold text-white">إضافة شريحة جديدة</h2>
        <p className="text-gray-500 text-xs">
          نفّذ ملف SQL من <code className="text-[#D4AF37]">insforge/hero_slides.sql</code> إن لم يكن الجدول موجوداً.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            id="hero-new-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onUploadNew(e)}
          />
          <label
            htmlFor="hero-new-file"
            className="luxury-button px-5 py-2 rounded-full text-black font-bold text-sm cursor-pointer"
          >
            رفع صورة من المعرض
          </label>
          <span className="text-gray-500 text-xs">أو الصق رابط الصورة:</span>
        </div>
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          dir="ltr"
          placeholder="https://…"
          className="w-full glass rounded-xl px-4 py-3 text-white text-sm"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="عنوان رئيسي" value={newHeadline} onChange={setNewHeadline} />
          <Field label="سطر فرعي" value={newSubline} onChange={setNewSubline} />
          <Field label="نص الزر" value={newCta} onChange={setNewCta} />
          <Field label="رابط الزر (#products أو URL)" value={newHref} onChange={setNewHref} dir="ltr" />
          <Field label="ترتيب العرض" value={newOrder} onChange={setNewOrder} type="number" />
        </div>
        <button type="button" onClick={() => void addSlide()} className="luxury-button px-8 py-3 rounded-full text-black font-bold">
          إضافة للسلايدر
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">جاري التحميل…</p>
      ) : slides.length === 0 ? (
        <p className="text-gray-500">لا توجد شرائح بعد — أضف واحدة أو سيظهر السلايدر الافتراضي في الموقع.</p>
      ) : (
        <div className="space-y-6">
          {slides.map((s) => (
            <div key={s.id} className="glass rounded-2xl p-4 flex flex-col lg:flex-row gap-4 border border-white/10">
              <div className="shrink-0 w-full lg:w-40">
                <img src={s.image_url} alt="" className="w-full h-28 object-cover rounded-xl border border-white/10" />
                <input
                  id={`hero-replace-${s.id}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void replaceImage(s.id, e)}
                />
                <label
                  htmlFor={`hero-replace-${s.id}`}
                  className="mt-2 block text-center text-xs text-[#D4AF37] underline cursor-pointer"
                >
                  استبدال الصورة
                </label>
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-2 text-sm">
                <Field
                  label="عنوان"
                  value={s.headline_ar ?? ''}
                  onChange={(v) => patchSlide(s.id, { headline_ar: v || null })}
                />
                <Field
                  label="وصف"
                  value={s.subline_ar ?? ''}
                  onChange={(v) => patchSlide(s.id, { subline_ar: v || null })}
                />
                <Field
                  label="زر"
                  value={s.cta_label_ar ?? ''}
                  onChange={(v) => patchSlide(s.id, { cta_label_ar: v || null })}
                />
                <Field
                  label="رابط"
                  value={s.cta_href ?? ''}
                  onChange={(v) => patchSlide(s.id, { cta_href: v || null })}
                  dir="ltr"
                />
                <Field
                  label="ترتيب"
                  value={String(s.sort_order)}
                  onChange={(v) => patchSlide(s.id, { sort_order: Number(v) || 0 })}
                  type="number"
                />
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.active}
                      onChange={(e) => patchSlide(s.id, { active: e.target.checked })}
                    />
                    نشط
                  </label>
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => void saveRow(s)}
                    className="luxury-button px-6 py-2 rounded-full text-black font-bold text-sm disabled:opacity-50"
                  >
                    {busyId === s.id ? '…' : 'حفظ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeRow(s.id)}
                    className="glass px-6 py-2 rounded-full text-red-300 text-sm border border-red-900/40"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: 'ltr';
}) {
  return (
    <div>
      <label className="text-gray-500 text-xs">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full mt-1 glass rounded-lg px-3 py-2 text-white text-sm"
      />
    </div>
  );
}
