import { insforge } from './insforgeClient';

export async function fetchWishlistIds(userId: string): Promise<{
  data: number[];
  error: Error | null;
}> {
  const { data, error } = await insforge.database
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId);
  if (error) return { data: [], error: error as Error };
  const ids = (data as { product_id: number }[]).map((r) => Number(r.product_id));
  return { data: ids, error: null };
}

export async function toggleWishlist(userId: string, productId: number, isSaved: boolean) {
  if (isSaved) {
    const { error } = await insforge.database
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) return { ok: false as const, error: (error as Error).message };
    return { ok: true as const };
  }
  const { error } = await insforge.database.from('wishlist').insert([{ user_id: userId, product_id: productId }]);
  if (error) return { ok: false as const, error: (error as Error).message };
  return { ok: true as const };
}
