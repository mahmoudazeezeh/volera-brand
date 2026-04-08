import { insforge } from './insforgeClient';
import type { Product } from '../types/Product';
import { fetchProducts } from './productApi';
import { ensureValidInsforgeAccessToken, isLikelyInvalidTokenMessage } from './insforgeSession';

function dbErr(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export type AdminOrder = {
  id: number;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_zone_id: number;
  delivery_details: string | null;
  total_amount: number;
  status: string;
  items: unknown;
  created_at?: string;
  zoneName: string;
};

export type ProductImageRow = {
  id: number;
  product_id: number;
  storage_key: string;
  url: string;
  sort_order: number;
};

export async function fetchAdminStats(): Promise<{
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  error: Error | null;
}> {
  await ensureValidInsforgeAccessToken();
  const head = { count: 'exact' as const, head: true };
  const run = () =>
    Promise.all([
      insforge.database.from('volera_profiles').select('id', head),
      insforge.database.from('orders').select('id', head),
      insforge.database.from('orders').select('id', head).eq('status', 'pending'),
      insforge.database.from('products').select('id', head),
    ]);
  let [u, o, pend, pr] = await run();
  let err = (u.error ?? o.error ?? pend.error ?? pr.error) as Error | null;
  if (err && isLikelyInvalidTokenMessage(dbErr(err))) {
    await ensureValidInsforgeAccessToken();
    [u, o, pend, pr] = await run();
    err = (u.error ?? o.error ?? pend.error ?? pr.error) as Error | null;
  }
  return {
    totalUsers: u.count ?? 0,
    totalOrders: o.count ?? 0,
    pendingOrders: pend.count ?? 0,
    totalProducts: pr.count ?? 0,
    error: err,
  };
}

export async function fetchAdminOrders(): Promise<{
  data: AdminOrder[];
  error: Error | null;
}> {
  await ensureValidInsforgeAccessToken();
  const q = () =>
    insforge.database.from('orders').select('*').order('id', { ascending: false });
  let { data: orders, error: oErr } = await q();
  if (oErr && isLikelyInvalidTokenMessage(dbErr(oErr))) {
    await ensureValidInsforgeAccessToken();
    ({ data: orders, error: oErr } = await q());
  }

  if (oErr) {
    return { data: [], error: oErr as Error };
  }

  const { data: zones } = await insforge.database.from('delivery_zones').select('id, name_ar');
  const zoneMap = new Map<number, string>();
  for (const z of (zones as { id: number; name_ar: string }[]) ?? []) {
    zoneMap.set(Number(z.id), z.name_ar);
  }

  const list = ((orders as Record<string, unknown>[]) ?? []).map((row) => {
    const delivery_zone_id = Number(row.delivery_zone_id);
    return {
      ...row,
      id: Number(row.id),
      delivery_zone_id,
      total_amount: Number(row.total_amount),
      zoneName: zoneMap.get(delivery_zone_id) ?? '—',
    } as AdminOrder;
  });

  return { data: list, error: null };
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const run = () => insforge.database.from('orders').update({ status }).eq('id', orderId);
  let { error } = await run();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ error } = await run());
  }
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function fetchProductImages(productId: number): Promise<{
  data: ProductImageRow[];
  error: Error | null;
}> {
  await ensureValidInsforgeAccessToken();
  const q = () =>
    insforge.database
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
  let { data, error } = await q();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ data, error } = await q());
  }
  if (error) return { data: [], error: error as Error };
  return { data: (data as ProductImageRow[]) ?? [], error: null };
}

function extFromFile(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith('.png')) return 'png';
  if (n.endsWith('.webp')) return 'webp';
  if (n.endsWith('.gif')) return 'gif';
  if (n.endsWith('.heic')) return 'heic';
  if (n.endsWith('.heif')) return 'heif';
  if (n.endsWith('.avif')) return 'avif';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tif|tiff)$/i.test(file.name);
}

export async function uploadProductImage(
  productId: number,
  file: File
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isLikelyImageFile(file)) {
    return { ok: false, error: 'الملف المختار ليس صورة. اختر ملفاً من معرض الصور.' };
  }
  await ensureValidInsforgeAccessToken();
  const ext = extFromFile(file);
  const key = `p${productId}/${crypto.randomUUID()}.${ext}`;
  const { data: up, error: upErr } = await insforge.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(key, file);
  if (upErr || !up?.url) {
    return { ok: false, error: upErr?.message ?? 'فشل رفع الصورة' };
  }

  const finishDbAfterUpload = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    const { data: existing } = await insforge.database
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder =
      Array.isArray(existing) && existing[0] && typeof (existing[0] as { sort_order: number }).sort_order === 'number'
        ? (existing[0] as { sort_order: number }).sort_order + 1
        : 0;

    const { error: insErr } = await insforge.database.from('product_images').insert([
      {
        product_id: productId,
        storage_key: up.key,
        url: up.url,
        sort_order: nextOrder,
      },
    ]);

    if (insErr) return { ok: false, error: dbErr(insErr) };

    const { data: first } = await insforge.database
      .from('product_images')
      .select('url')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .limit(1);
    const primary =
      Array.isArray(first) && first[0] && typeof (first[0] as { url: string }).url === 'string'
        ? (first[0] as { url: string }).url
        : up.url;

    const { data: imgs } = await insforge.database
      .from('product_images')
      .select('url')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
    const urls = ((imgs as { url: string }[]) ?? []).map((r) => r.url);

    const { error: updErr } = await insforge.database
      .from('products')
      .update({ image: primary, images: urls.length ? urls : [primary] })
      .eq('id', productId);
    if (updErr) return { ok: false, error: dbErr(updErr) };
    return { ok: true };
  };

  let dbResult = await finishDbAfterUpload();
  if (!dbResult.ok && isLikelyInvalidTokenMessage(dbResult.error)) {
    await ensureValidInsforgeAccessToken();
    dbResult = await finishDbAfterUpload();
  }

  if (!dbResult.ok) {
    await insforge.storage.from(PRODUCT_IMAGES_BUCKET).remove(up.key).catch(() => {});
    return { ok: false, error: dbResult.error };
  }

  return { ok: true, url: up.url };
}

/** رفع صورة خلفية لسلايدر الهيرو (مجلد hero/ في نفس الـ bucket). */
export async function uploadHeroBannerFile(
  file: File
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isLikelyImageFile(file)) {
    return { ok: false, error: 'الملف المختار ليس صورة.' };
  }
  await ensureValidInsforgeAccessToken();
  const ext = extFromFile(file);
  const key = `hero/${crypto.randomUUID()}.${ext}`;
  const { data: up, error: upErr } = await insforge.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(key, file);
  if (upErr || !up?.url) {
    return { ok: false, error: upErr?.message ?? 'فشل رفع الصورة' };
  }
  return { ok: true, url: up.url };
}

export async function syncProductImagesFromGallery(productId: number): Promise<void> {
  await ensureValidInsforgeAccessToken();
  const { data: imgs } = await insforge.database
    .from('product_images')
    .select('url')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  const urls = ((imgs as { url: string }[]) ?? []).map((r) => r.url);
  if (!urls.length) {
    await insforge.database.from('products').update({ image: '', images: [] }).eq('id', productId);
    return;
  }
  await insforge.database
    .from('products')
    .update({ image: urls[0], images: urls })
    .eq('id', productId);
}

export async function deleteProductImage(
  imageId: number,
  storageKey: string,
  productId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const del = () => insforge.database.from('product_images').delete().eq('id', imageId);
  let { error: dErr } = await del();
  if (dErr && isLikelyInvalidTokenMessage(dbErr(dErr))) {
    await ensureValidInsforgeAccessToken();
    ({ error: dErr } = await del());
  }
  if (dErr) return { ok: false, error: (dErr as Error).message };
  await insforge.storage.from(PRODUCT_IMAGES_BUCKET).remove(storageKey).catch(() => {});
  await syncProductImagesFromGallery(productId);
  return { ok: true };
}

export type AdminProductInsert = {
  name: string;
  name_ar: string;
  price: number;
  category: string;
  description: string;
  description_ar: string;
  discount?: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  size_ml?: string;
  image: string;
  images?: string[];
  is_featured?: boolean;
};

export async function adminInsertProduct(
  row: AdminProductInsert
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const images = row.images?.length ? row.images : [row.image];
  const doInsert = () =>
    insforge.database
      .from('products')
      .insert([
        {
          name: row.name.trim(),
          name_ar: row.name_ar.trim(),
          price: row.price,
          discount: row.discount ?? 0,
          image: row.image,
          category: row.category,
          description: row.description.trim(),
          description_ar: row.description_ar.trim(),
          sizes: ['50 مل'],
          images,
          is_featured: row.is_featured ?? false,
          stock_quantity: row.stock_quantity,
          low_stock_threshold: row.low_stock_threshold ?? 5,
          size_ml: row.size_ml ?? '50 ml',
        },
      ])
      .select('id');

  let { data, error } = await doInsert();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ data, error } = await doInsert());
  }

  if (error) return { ok: false, error: (error as Error).message };
  const r = Array.isArray(data) ? data[0] : data;
  const id = r && typeof r === 'object' && 'id' in r ? Number((r as { id: number }).id) : 0;
  if (!id) return { ok: false, error: 'لم يُرجَد المنتج' };
  return { ok: true, id };
}

export async function adminUpdateProduct(
  id: number,
  patch: Partial<
    Pick<
      AdminProductInsert,
      | 'name'
      | 'name_ar'
      | 'price'
      | 'category'
      | 'description'
      | 'description_ar'
      | 'discount'
      | 'stock_quantity'
      | 'low_stock_threshold'
      | 'size_ml'
      | 'image'
    >
  > & { images?: string[] }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const run = () => insforge.database.from('products').update(patch).eq('id', id);
  let { error } = await run();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ error } = await run());
  }
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function adminDeleteProduct(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const { data: imgs } = await insforge.database.from('product_images').select('storage_key').eq('product_id', id);
  const keys = ((imgs as { storage_key: string }[]) ?? []).map((x) => x.storage_key).filter(Boolean);
  if (keys.length) {
    await Promise.all(
      keys.map((k) => insforge.storage.from(PRODUCT_IMAGES_BUCKET).remove(k))
    ).catch(() => {});
  }
  await insforge.database.from('product_images').delete().eq('product_id', id);
  const { error } = await insforge.database.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function fetchAdminProducts(): Promise<{ data: Product[]; error: Error | null }> {
  await ensureValidInsforgeAccessToken();
  return fetchProducts();
}
