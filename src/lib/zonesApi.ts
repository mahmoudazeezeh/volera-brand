import { insforge } from './insforgeClient';
import { ensureValidInsforgeAccessToken, isLikelyInvalidTokenMessage } from './insforgeSession';

function dbErr(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}

export type DeliveryZone = {
  id: number;
  name_ar: string;
  delivery_price: number;
  active: boolean;
  sort_order: number;
};

export async function fetchDeliveryZones(): Promise<{
  data: DeliveryZone[];
  error: Error | null;
}> {
  const { data, error } = await insforge.database
    .from('delivery_zones')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error as Error };
  return { data: (data as DeliveryZone[]) ?? [], error: null };
}

export async function fetchAllZonesAdmin(): Promise<{
  data: DeliveryZone[];
  error: Error | null;
}> {
  await ensureValidInsforgeAccessToken();
  const q = () =>
    insforge.database.from('delivery_zones').select('*').order('sort_order', { ascending: true });
  let { data, error } = await q();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ data, error } = await q());
  }
  if (error) return { data: [], error: error as Error };
  return { data: (data as DeliveryZone[]) ?? [], error: null };
}

export async function insertDeliveryZone(params: {
  name_ar: string;
  delivery_price: number;
  active?: boolean;
  sort_order?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const run = () =>
    insforge.database.from('delivery_zones').insert([
      {
        name_ar: params.name_ar.trim(),
        delivery_price: Number(params.delivery_price),
        active: params.active ?? true,
        sort_order: params.sort_order ?? 99,
      },
    ]);
  let { error } = await run();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ error } = await run());
  }
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function updateDeliveryZone(
  id: number,
  patch: Partial<Pick<DeliveryZone, 'name_ar' | 'delivery_price' | 'active' | 'sort_order'>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const run = () => insforge.database.from('delivery_zones').update(patch).eq('id', id);
  let { error } = await run();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ error } = await run());
  }
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function deleteDeliveryZone(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureValidInsforgeAccessToken();
  const run = () => insforge.database.from('delivery_zones').delete().eq('id', id);
  let { error } = await run();
  if (error && isLikelyInvalidTokenMessage(dbErr(error))) {
    await ensureValidInsforgeAccessToken();
    ({ error } = await run());
  }
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}
