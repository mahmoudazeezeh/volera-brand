import { insforge } from './insforgeClient';

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
  const { data, error } = await insforge.database
    .from('delivery_zones')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return { data: [], error: error as Error };
  return { data: (data as DeliveryZone[]) ?? [], error: null };
}

export async function insertDeliveryZone(params: {
  name_ar: string;
  delivery_price: number;
  active?: boolean;
  sort_order?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await insforge.database.from('delivery_zones').insert([
    {
      name_ar: params.name_ar.trim(),
      delivery_price: Number(params.delivery_price),
      active: params.active ?? true,
      sort_order: params.sort_order ?? 99,
    },
  ]);
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function updateDeliveryZone(
  id: number,
  patch: Partial<Pick<DeliveryZone, 'name_ar' | 'delivery_price' | 'active' | 'sort_order'>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await insforge.database.from('delivery_zones').update(patch).eq('id', id);
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}

export async function deleteDeliveryZone(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await insforge.database.from('delivery_zones').delete().eq('id', id);
  if (error) return { ok: false, error: (error as Error).message };
  return { ok: true };
}
