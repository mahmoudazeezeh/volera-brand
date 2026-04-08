import { insforge } from './insforgeClient';

export type VoleraProfile = {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string;
  role: 'customer' | 'admin';
  account_status: 'pending_verification' | 'active' | 'suspended';
  created_at: string;
};

/**
 * بعد أول تسجيل للمشرف، نفّذ في InsForge (SQL) — أو حدّث insforge/rls_products_admin.sql ليطابق ADMIN_EMAIL:
 * UPDATE public.volera_profiles SET role = 'admin', account_status = 'active'
 * WHERE lower(email) = lower('mahmmoadaziza@gmail.com');
 *
 * لإضافة/تعديل/حذف المنتجات من لوحة التحكم، نفّذ (أعد تنفيذه بعد كل تعديل على الدالة):
 * insforge/rls_products_admin.sql — الدالة تستخدم request.jwt.claims->>'sub' مع InsForge (ليس auth.uid() فقط).
 */
export async function fetchProfile(userId: string) {
  const { data, error } = await insforge.database
    .from('volera_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { data: null as VoleraProfile | null, error: error as Error };
  return { data: data as VoleraProfile | null, error: null };
}

export async function insertProfile(row: {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string;
  role?: 'customer' | 'admin';
  account_status?: 'pending_verification' | 'active' | 'suspended';
}) {
  const { data, error } = await insforge.database
    .from('volera_profiles')
    .insert([
      {
        id: row.id,
        full_name: row.full_name,
        phone_e164: row.phone_e164,
        email: row.email,
        role: row.role ?? 'customer',
        account_status: row.account_status ?? 'active',
      },
    ])
    .select('*');
  if (error) return { ok: false as const, error: (error as Error).message };
  return { ok: true as const, data };
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<VoleraProfile, 'full_name' | 'phone_e164' | 'account_status'>>
) {
  const { error } = await insforge.database.from('volera_profiles').update(patch).eq('id', userId);
  if (error) return { ok: false as const, error: (error as Error).message };
  return { ok: true as const };
}
