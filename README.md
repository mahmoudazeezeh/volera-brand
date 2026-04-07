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

1. **Settings → Pages → Build and deployment → Source:** اختر **GitHub Actions** (ليس Deploy from a branch).
2. إن ظهرت بيئة `github-pages` مع **مطلوب موافقون**: إزالة القيد من **Settings → Environments → github-pages** أو الموافقة على النشر.
3. ادفع إلى `main` أو نفّذ يدوياً: **Actions → Deploy site to GitHub Pages → Run workflow**.
4. الرابط: `https://mahmoudazeezeh.github.io/volera-brand/`

> مسار الإنتاج في `vite.config.ts` هو `/volera-brand/`. للنشر على جذر النطاق غيّر `base` إلى `'/'`.
