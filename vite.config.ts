import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  /** لنشر GitHub Pages على https://USER.github.io/volera-brand/ */
  base: mode === 'production' ? '/volera-brand/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
