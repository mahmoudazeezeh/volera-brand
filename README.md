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

إذا ظهر خطأ **row-level security** عند إضافة أو تعديل منتج، نفّذ في InsForge → SQL محتوى الملف **`insforge/rls_products_admin.sql`** مرة واحدة.  
تأكد أن حسابك في **`volera_profiles`** له **`role = 'admin'`** و **`account_status = 'active'`** (انظر تعليقات `src/lib/profileApi.ts`).

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
