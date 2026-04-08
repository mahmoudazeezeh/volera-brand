import type { UserSchema } from '@insforge/sdk';
import { insforge } from './insforgeClient';
import {
  persistInsforgeRefreshToken,
  persistRefreshTokenFromAuthPayload,
  readStoredInsforgeRefreshToken,
} from './insforgeAuthStorage';

type TokenManagerLike = {
  saveSession: (s: { accessToken: string; user: UserSchema }) => void;
  getSession: () => { accessToken: string; user: UserSchema } | null;
  getAccessToken: () => string | null;
  getUser: () => UserSchema | null;
  setAccessToken: (token: string) => void;
};

function getTokenManager(): TokenManagerLike {
  return (insforge as unknown as { tokenManager: TokenManagerLike }).tokenManager;
}

/**
 * طبقة PostgREST في @insforge/sdk تضع `Authorization` من tokenManager.getAccessToken() أولاً؛
 * إن وُجدت قيمة (حتى منتهية) تُتجاهل `HttpClient.setAuthToken`. لذلك يجب تحديث tokenManager
 * مع كل access token جديد وإلا تبقى عمليات products على JWT قديم وتفشل RLS/الصلاحيات.
 */
export function syncInsforgeAccessTokenForDatabase(accessToken: string, userHint?: UserSchema | null): void {
  const tm = getTokenManager();
  const user = userHint ?? tm.getUser() ?? undefined;
  insforge.getHttpClient().setAuthToken(accessToken);
  if (user) {
    tm.saveSession({ accessToken, user });
  } else {
    tm.setAccessToken(accessToken);
  }
}

type HttpClientUserToken = { userToken: string | null };

/**
 * طبقة PostgREST في الـ SDK تبني الترويسة كالتالي: `tokenManager.getAccessToken() || HttpClient.userToken`.
 * إذا بقي access token قديماً في TokenManager بينما `setAuthToken` ضبط قيمة أحدث، تُستخدم القيمة القديمة
 * لطلبات الجداول. نعيد المحاذاة قبل العمليات الحساسة.
 */
export function reconcileInsforgeDatabaseAuth(): void {
  const tm = getTokenManager();
  const http = insforge.getHttpClient() as unknown as HttpClientUserToken;
  const tmToken = tm.getAccessToken();
  const userToken = http.userToken;

  if (tmToken === userToken) return;

  let canonical: string | null;
  if (userToken && tmToken && userToken !== tmToken) {
    canonical = userToken;
  } else {
    canonical = userToken || tmToken;
  }
  if (!canonical) return;

  const sess = tm.getSession();
  const user = sess?.user ?? tm.getUser() ?? undefined;
  syncInsforgeAccessTokenForDatabase(canonical, user ?? null);
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
  reconcileInsforgeDatabaseAuth();

  const { data, error } = await insforge.auth.refreshSession();
  if (!error && data?.accessToken) {
    persistRefreshTokenFromAuthPayload(data);
    const u = (data as { user?: UserSchema }).user;
    syncInsforgeAccessTokenForDatabase(data.accessToken, u ?? null);
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

  insforge.getHttpClient().setRefreshToken(newRt);
  persistInsforgeRefreshToken(newRt);
  syncInsforgeAccessTokenForDatabase(accessToken, user ?? null);
}

export { persistInsforgeRefreshToken, persistRefreshTokenFromAuthPayload };
