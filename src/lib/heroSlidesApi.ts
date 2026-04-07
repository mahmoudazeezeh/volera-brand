import { insforge } from './insforgeClient';

export type HeroSlide = {
  id: number;
  image_url: string;
  headline_ar: string | null;
  subline_ar: string | null;
  cta_label_ar: string | null;
  cta_href: string | null;
  sort_order: number;
  active: boolean;
};

/** صور الهيرو المحلية (public/hero) — تظهر عند عدم وجود شرائح في قاعدة البيانات. */
export const FALLBACK_HERO_SLIDES: Omit<HeroSlide, 'id' | 'active'>[] = [
  {
    image_url: '/hero/volera-slide-vault.png',
    headline_ar: 'عالم يُفتح للأناقة فقط',
    subline_ar: 'خزنة الأسرار — حيث يلتقي الذهبيّ بالظلال والفخامة',
    cta_label_ar: 'اكتشف المجموعة',
    cta_href: '#products',
    sort_order: 0,
  },
  {
    image_url: '/hero/volera-slide-bottle.png',
    headline_ar: 'فولـيرا',
    subline_ar: 'لمسة ذهبية على عبقٍ لا يُنسى — رائحة تتجاوز الكلمات',
    cta_label_ar: 'تسوق العطور',
    cta_href: '#products',
    sort_order: 1,
  },
];

export async function fetchPublicHeroSlides(): Promise<{
  data: HeroSlide[];
  error: Error | null;
}> {
  const { data, error } = await insforge.database
    .from('hero_slides')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return { data: [], error: error as Error };
  }
  const rows = (data as HeroSlide[]) ?? [];
  return { data: rows, error: null };
}

export async function fetchAllHeroSlidesAdmin(): Promise<{
  data: HeroSlide[];
  error: Error | null;
}> {
  const { data, error } = await insforge.database
    .from('hero_slides')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return { data: [], error: error as Error };
  return { data: (data as HeroSlide[]) ?? [], error: null };
}

export async function insertHeroSlide(row: {
  image_url: string;
  headline_ar?: string;
  subline_ar?: string;
  cta_label_ar?: string;
  cta_href?: string;
  sort_order?: number;
  active?: boolean;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const { data, error } = await insforge.database
    .from('hero_slides')
    .insert([
      {
        image_url: row.image_url,
        headline_ar: row.headline_ar ?? null,
        subline_ar: row.subline_ar ?? null,
        cta_label_ar: row.cta_label_ar ?? 'اكتشف المجموعة',
        cta_href: row.cta_href ?? '#products',
        sort_order: row.sort_order ?? 0,
        active: row.active ?? true,
      },
    ])
    .select('id');

  if (error) return { ok: false, error: (error as Error).message };
  const r = Array.isArray(data) ? data[0] : data;
  const id = r && typeof r === 'object' && 'id' in r ? Number((r as { id: number }).id) : 0;
  if (!id) return { ok: false, error: 'لم يُنشأ السلايد' };
  return { ok: true, id };
}

export async function updateHeroSlide(
  id: number,
  patch: Partial<
    Pick<
      HeroSlide,
      'image_url' | 'headline_ar' | 'subline_ar' | 'cta_label_ar' | 'cta_href' | 'sort_order' | 'active'
    >
  >
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await insforge.database.from('hero_slides').update(patch).eq('id', id);
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function deleteHeroSlide(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await insforge.database.from('hero_slides').delete().eq('id', id);
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}
