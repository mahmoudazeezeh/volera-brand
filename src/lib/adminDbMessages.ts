/** يوضّح للمشرف خطأ RLS دون تغيير منطق الـ API */
export function enhanceAdminDbErrorMessage(message: string | null): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes('row-level security') || m.includes('violates row-level')) {
    return `${message}\n\n• نفّذ في InsForge → SQL أحدث ملف insforge/rls_products_admin.sql من المستودع.\n• طابق volera_admin_email داخل الدالة مع ADMIN_EMAIL في src/config/volera.ts.\n• أو عيّن role = admin في volera_profiles لنفس معرّف المستخدم (sub في JWT).\n• ثم سجّل خروجاً ودخولاً.`;
  }
  return message;
}
