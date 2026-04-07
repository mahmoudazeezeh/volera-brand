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

## النشر على GitHub Pages

السير يبني المشروع ويدفع محتوى **`dist`** إلى فرع **`gh-pages`** تلقائياً عند كل دفع إلى **`main`**.

### إعداد لمرة واحدة في المستودع

1. **Settings → Pages**
2. **Build and deployment → Source:** اختر **Deploy from a branch**
3. **Branch:** `gh-pages` ، **Folder:** `/ (root)` ثم **Save**

بعد أول نجاح للسير سيُنشأ فرع `gh-pages`؛ إن لم يظهر في القائمة، انتظر انتهاء الـ workflow ثم حدّث الصفحة.

4. الرابط: `https://mahmoudazeezeh.github.io/volera-brand/`

> مسار الإنتاج في `vite.config.ts` هو `/volera-brand/`. للنشر على جذر النطاق غيّر `base` إلى `'/'`.

### تشغيل يدوي

**Actions → Deploy site to GitHub Pages → Run workflow**
