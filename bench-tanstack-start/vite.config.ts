import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleSuggestions } from './api/suggestions';

// Serves GET /api/suggestions in dev AND preview from the same handler,
// so the TanStack build has zero extra servers/processes.
function suggestionsApi() {
  const middleware = async (req: any, res: any, next: any) => {
    let pathname = '';
    let search = '';
    try {
      const url = new URL(req.url, 'http://localhost');
      pathname = url.pathname;
      search = url.search;
    } catch {
      return next();
    }
    if (pathname !== '/api/suggestions' || req.method !== 'GET') return next();
    const q = new URLSearchParams(search).get('q');
    try {
      const { status, headers, body } = await handleSuggestions(q);
      res.statusCode = status;
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
      res.end(body);
    } catch (e) {
      console.error('suggestions api error:', e);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end('[]');
    }
  };
  return {
    name: 'suggestions-api',
    configureServer(server: any) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), suggestionsApi()],
  build: {
    cssMinify: true,
    minify: 'esbuild',
  },
});
