import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Static homepage (prerendered) + serverless /api/suggestions on Vercel.
// Homepage ships zero JS by default; only the search island hydrates.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true,
      minify: 'esbuild',
    },
  },
});
