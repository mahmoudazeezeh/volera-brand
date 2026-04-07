/** بريد المشرف — صلاحيات لوحة التحكم بعد ترقية السجل في volera_profiles (انظر تعليمات في profileApi). */
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
