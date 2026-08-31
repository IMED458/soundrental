import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';

/** `/soundrental` · `soundrental/` · `` → `/soundrental/` (and `/` for the root). */
function normalizeBase(raw: string): string {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/**
 * GitHub Pages serves 404.html for every unknown path. It stashes the requested
 * deep link and bounces to index.html, which restores it before the router boots.
 * Emitted here so the number of path segments always matches the deploy base —
 * a hardcoded copy in public/ breaks as soon as the base changes.
 */
function spaFallback(base: string): Plugin {
  return {
    name: 'soundrental-spa-fallback',
    apply: 'build',
    generateBundle() {
      const segments = base === '/' ? 0 : base.split('/').filter(Boolean).length;
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>…</title>
    <script>
      (function () {
        var segments = ${segments};
        var l = window.location;
        var path = l.pathname.split('/').slice(1 + segments).join('/');
        var target =
          l.protocol + '//' + l.host + l.pathname.split('/').slice(0, 1 + segments).join('/') + '/?redirect=/' +
          path + (l.search ? '&' + l.search.slice(1) : '') + l.hash;
        l.replace(target);
      })();
    </script>
  </head>
  <body style="background:#0A0A0B"></body>
</html>
`,
      });
      // Keep GitHub Pages from running the output through Jekyll.
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Deploying to GitHub Pages under /soundrental/ by default.
  // Set VITE_BASE=/ for a custom domain or a user/organization Pages site.
  const base = normalizeBase(env.VITE_BASE ?? '/soundrental/');
  return {
    base,
    plugins: [react(), tailwind(), spaFallback(base)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
            motion: ['lenis'],
          },
        },
      },
    },
  };
});
