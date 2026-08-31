import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Deploying to GitHub Pages under /soundrental/ by default.
    // Set VITE_BASE=/ for a custom domain.
    base: env.VITE_BASE || '/soundrental/',
    plugins: [react(), tailwind()],
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
