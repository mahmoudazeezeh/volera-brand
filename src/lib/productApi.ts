import { insforge } from './insforgeClient';
import type { Product } from '../types/Product';

export type ProductRow = {
  id: number | string;
  name: string;
  name_ar: string;
  price: number | string;
  original_price: number | string | null;
  discount: number | null;
  final_price?: number | string | null;
  image: string;
  category: string;
  description: string;
  description_ar: string;
  sizes: unknown;
  images: unknown;
  is_featured: boolean | null;
  stock_quantity?: number | string | null;
  low_stock_threshold?: number | string | null;
  size_ml?: string | null;
};

function decodeDiscountFromDb(raw: number | null): number {
  if (raw == null || !Number.isFinite(raw)) return 0;
  // القيم > 100 تمثل خصومات عشرية محفوظة بصيغة ×10 (125 => 12.5%).
  return raw > 100 ? raw / 10 : raw;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
    return value as string[];
  }
  return [];
}

async function fetchProductImagesGrouped(): Promise<Map<number, string[]>> {
  const { data } = await insforge.database
    .from('product_images')
    .select('product_id, url, sort_order')
    .order('sort_order', { ascending: true });
  const m = new Map<number, string[]>();
  for (const row of (data as { product_id: number; url: string }[]) ?? []) {
    const id = Number(row.product_id);
    if (!m.has(id)) m.set(id, []);
    m.get(id)!.push(row.url);
  }
  return m;
}

function mergeGalleryImages(p: Product, gallery: Map<number, string[]>): Product {
  const extra = gallery.get(p.id);
  if (!extra?.length) return p;
  const merged = [...extra, ...p.images.filter((u) => !extra.includes(u))];
  return { ...p, images: merged, image: merged[0] ?? p.image };
}

export function mapRowToProduct(row: ProductRow): Product {
  const price = Number(row.price);
  const discount = decodeDiscountFromDb(row.discount);
  const computedFinal =
    row.final_price != null && row.final_price !== ''
      ? Number(row.final_price)
      : Math.round(price * (1 - discount / 100) * 100) / 100;
  const stock = row.stock_quantity != null ? Number(row.stock_quantity) : 0;
  const lowTh = row.low_stock_threshold != null ? Number(row.low_stock_threshold) : 5;

  return {
    id: Number(row.id),
    name: row.name,
    nameAr: row.name_ar,
    price,
    originalPrice:
      row.original_price != null && row.original_price !== ''
        ? Number(row.original_price)
        : undefined,
    discount: row.discount != null ? discount : undefined,
    finalPrice: computedFinal,
    image: row.image,
    category: row.category,
    description: row.description,
    descriptionAr: row.description_ar,
    sizes: asStringArray(row.sizes),
    images: asStringArray(row.images),
    isFeatured: Boolean(row.is_featured),
    stockQuantity: stock,
    lowStockThreshold: lowTh,
    sizeMl: row.size_ml ?? '50 ml',
    lowStock: stock < lowTh,
  };
}

export async function fetchProducts(): Promise<{ data: Product[]; error: Error | null }> {
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    return { data: [], error: error as Error };
  }
  if (!data?.length) {
    return { data: [], error: null };
  }
  const gallery = await fetchProductImagesGrouped();
  return {
    data: (data as ProductRow[]).map((r) => mergeGalleryImages(mapRowToProduct(r), gallery)),
    error: null,
  };
}

function escapeIlike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** بحث بالاسم والوصف عبر الاستعلام في قاعدة البيانات (ILIKE). */
export async function searchProducts(
  q: string
): Promise<{ data: Product[]; error: Error | null }> {
  const term = q.trim();
  if (!term) {
    return fetchProducts();
  }
  const safe = term.replace(/,/g, ' ');
  const pattern = `%${escapeIlike(safe)}%`;
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .or(
      `name.ilike.${pattern},name_ar.ilike.${pattern},description.ilike.${pattern},description_ar.ilike.${pattern}`
    )
    .order('id', { ascending: true });

  if (error) {
    return { data: [], error: error as Error };
  }
  if (!data?.length) {
    return { data: [], error: null };
  }
  const gallery = await fetchProductImagesGrouped();
  return {
    data: (data as ProductRow[]).map((r) => mergeGalleryImages(mapRowToProduct(r), gallery)),
    error: null,
  };
}

export async function fetchProductById(
  id: number
): Promise<{ data: Product | null; error: Error | null }> {
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error as Error };
  }
  if (!data) {
    return { data: null, error: null };
  }
  const gallery = await fetchProductImagesGrouped();
  return {
    data: mergeGalleryImages(mapRowToProduct(data as ProductRow), gallery),
    error: null,
  };
}
