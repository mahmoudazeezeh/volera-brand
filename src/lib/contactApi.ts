import { insforge } from './insforgeClient';

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

export async function submitContactMessage(
  payload: ContactPayload
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const { data, error } = await insforge.database
    .from('contact_messages')
    .insert([
      {
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone?.trim() || null,
        message: payload.message.trim(),
      },
    ])
    .select('id');

  if (error) {
    return { ok: false, error: (error as Error).message || 'فشل الإرسال' };
  }
  const row = Array.isArray(data) ? data[0] : data;
  const id = row && typeof row === 'object' && 'id' in row ? Number((row as { id: number }).id) : 0;
  return { ok: true, id };
}
