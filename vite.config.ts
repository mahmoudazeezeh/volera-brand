import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * مسار الأصول في الإنتاج:
 * - Vercel / معظم الاستضافات: جذر `/` (يُضبط تلقائياً عبر متغير VERCEL أثناء البناء)
 * - GitHub Pages لمشروع تحت المسار: `/volera-brand/` (يُمرَّر من workflow عبر VITE_BASE_PATH)
 */
function productionBase(): string {
  const fromEnv = process.env.VITE_BASE_PATH;
  if (fromEnv != null && fromEnv !== '') {
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
  }
  if (process.env.VERCEL) {
    return '/';
  }
  return '/volera-brand/';
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? productionBase() : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
