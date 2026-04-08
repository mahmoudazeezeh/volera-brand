# VOLERA — فولـيرا

موقع دار عطور فاخرة: React، Vite، TypeScript، Tailwind.

## التشغيل المحلي

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
npm run preview
```

انسخ `.env.example` إلى `.env` واضبط متغيرات الربط بالخادم عند الحاجة.

### لوحة التحكم والمنتجات (InsForge)

نفّذ في InsForge → SQL محتوى **`insforge/rls_products_admin.sql`** كاملاً (يحدّث سياسات **المنتجات، الصور، مناطق التوصيل، الطلبات، بنود الطلب، الملفات الشخصية**).  
بعدها نفّذ **`insforge/hero_slides.sql`** إذا استخدمت سلايدر الإدارة.

إذا غيّرت بريد المشرف في `src/config/volera.ts`، عدّل القيمة **`volera_admin_email`** داخل الدالة في نفس ملف SQL.  
للصلاحية: **`volera_profiles.role = 'admin'`** و **`account_status = 'active'`** (أو بريد يطابق `ADMIN_EMAIL` وفق منطق الدالة).

للتحقق المحلي من الكود: `npm run verify`

## النشر على GitHub Pages

السير يبني المشروع ويدفع محتوى **`dist`** إلى فرع **`gh-pages`** تلقائياً عند كل دفع إلى **`main`**.

### إعداد لمرة واحدة في المستودع

1. **Settings → Pages**
2. **Build and deployment → Source:** اختر **Deploy from a branch**
3. **Branch:** `gh-pages` ، **Folder:** `/ (root)` ثم **Save**

بعد أول نجاح للسير سيُنشأ فرع `gh-pages`؛ إن لم يظهر في القائمة، انتظر انتهاء الـ workflow ثم حدّث الصفحة.

4. الرابط: `https://mahmoudazeezeh.github.io/volera-brand/`

> **المسارات:** على **GitHub Pages** يُبنى المشروع بـ `VITE_BASE_PATH=/volera-brand/` من الـ workflow. على **Vercel** يُكتشف `VERCEL` تلقائياً فيُستخدم الجذر `/` (لا حاجة لإعداد يدوي). لبناء محلي بجذر: `VITE_BASE_PATH=/ npm run build`.

### تشغيل يدوي

**Actions → Deploy site to GitHub Pages → Run workflow**
