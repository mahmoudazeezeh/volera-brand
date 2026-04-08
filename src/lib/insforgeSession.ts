import type { UserSchema } from '@insforge/sdk';
import { insforge } from './insforgeClient';
import {
  persistInsforgeRefreshToken,
  persistRefreshTokenFromAuthPayload,
  readStoredInsforgeRefreshToken,
} from './insforgeAuthStorage';

type TokenManagerLike = {
  saveSession: (s: { accessToken: string; user: UserSchema }) => void;
  getUser: () => UserSchema | null;
};

function getTokenManager(): TokenManagerLike {
  return (insforge as unknown as { tokenManager: TokenManagerLike }).tokenManager;
}

export function isLikelyInvalidTokenMessage(message: unknown): boolean {
  const m = String(message ?? '').toLowerCase();
  return (
    m.includes('invalid token') ||
    m.includes('invalid_token') ||
    (m.includes('jwt') && m.includes('expir')) ||
    m.includes('unauthorized')
  );
}

/**
 * طبقة PostgREST في الـ SDK تستخدم fetch مباشرة ولا تعيد المحاولة عند انتهاء access token.
 * نحدّث الجلسة صراحةً قبل عمليات الإدارة، ونستخدم refresh_token المحفوظ عند فشل الكوكيز (نطاق مختلف مثل Vercel ↔ InsForge).
 */
export async function ensureValidInsforgeAccessToken(): Promise<void> {
  const { data, error } = await insforge.auth.refreshSession();
  if (!error && data?.accessToken) {
    persistRefreshTokenFromAuthPayload(data);
    return;
  }

  const rt = readStoredInsforgeRefreshToken();
  if (!rt) return;

  const base = String(import.meta.env.VITE_INSFORGE_URL).replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/refresh?client_type=mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ refresh_token: rt }),
    });
  } catch {
    return;
  }

  const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !j) return;

  const accessToken =
    (typeof j.accessToken === 'string' && j.accessToken) ||
    (typeof j.access_token === 'string' && j.access_token) ||
    '';
  if (!accessToken) return;

  const newRt =
    (typeof j.refreshToken === 'string' && j.refreshToken) ||
    (typeof j.refresh_token === 'string' && j.refresh_token) ||
    rt;

  let user = j.user as UserSchema | undefined;
  if (!user || typeof user !== 'object') {
    insforge.getHttpClient().setAuthToken(accessToken);
    try {
      const cur = await insforge.getHttpClient().get<{ user: UserSchema }>('/api/auth/sessions/current');
      user = cur.user ?? undefined;
    } catch {
      user = getTokenManager().getUser() ?? undefined;
    }
  }

  if (user) {
    getTokenManager().saveSession({ accessToken, user });
  }
  insforge.getHttpClient().setAuthToken(accessToken);
  insforge.getHttpClient().setRefreshToken(newRt);
  persistInsforgeRefreshToken(newRt);
}

export { persistInsforgeRefreshToken, persistRefreshTokenFromAuthPayload };
