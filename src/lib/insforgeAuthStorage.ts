/** مفتاح sessionStorage — يُزامن مع insforgeClient عند التحميل */
export const INSFORGE_REFRESH_STORAGE_KEY = 'volera_insforge_refresh_v1';

export function readStoredInsforgeRefreshToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(INSFORGE_REFRESH_STORAGE_KEY);
}

export function persistInsforgeRefreshToken(token: string | null | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  if (token) sessionStorage.setItem(INSFORGE_REFRESH_STORAGE_KEY, token);
  else sessionStorage.removeItem(INSFORGE_REFRESH_STORAGE_KEY);
}

/** يستخرج refresh_token من استجابة تسجيل الدخول / التحقق */
export function persistRefreshTokenFromAuthPayload(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const o = data as Record<string, unknown>;
  const rt =
    (typeof o.refreshToken === 'string' && o.refreshToken) ||
    (typeof o.refresh_token === 'string' && o.refresh_token) ||
    undefined;
  if (rt) persistInsforgeRefreshToken(rt);
}
