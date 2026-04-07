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

1. في المستودع: **Settings → Pages → Build and deployment → Source**: اختر **GitHub Actions**.
2. عند كل دفع إلى فرع `main` يعمل سير العمل `.github/workflows/deploy-pages.yml` ويبني الموقع وينشره.
3. الرابط يكون بالشكل: `https://mahmoudazeezeh.github.io/volera-brand/`

> مسار الإنتاج مضبوط على `/volera-brand/` في `vite.config.ts` ليتوافق مع GitHub Pages. للنشر على نطاق جذر (مثل Vercel) غيّر `base` إلى `'/'`.
