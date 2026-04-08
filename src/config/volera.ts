/** بريد المشرف — لوحة التحكم في الواجهة + يجب أن يطابق volera_admin_email في insforge/rls_products_admin.sql (دالة volera_is_admin). */
export const ADMIN_EMAIL = 'mahmmoadaziza@gmail.com';

/** أرقام واتساب المشرف لنص الرسالة (الإرسال الفعلي عبر webhook الدالة notify-admin-order). */
export const ADMIN_WHATSAPP_DISPLAY = '+970592920049';

export const PHONE_PREFIXES = ['+970', '+972'] as const;

export const PRODUCT_CATEGORIES = [
  'عطور نسائية',
  'عطور رجالية',
  'بكجات عطر',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
