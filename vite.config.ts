import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import iconsData from "./public/icons/icons.json";

const icons = iconsData.icons.map((icon) => ({
  src: `/icons/${icon.src}`,
  sizes: icon.sizes,
  type: "image/png",
}));

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        // Desligado em DEV: o service worker cacheava assets/respostas antigos
        // (ex.: cookie CSRF defasado → login quebrado). O PWA continua ativo no
        // build de produção (vite build) — isto afeta só `yarn dev`.
        enabled: false,
        type: 'module',
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        id: 'GBCernePlatform',
        name: 'GB Cerne — Plataforma de Gestão Agro',
        short_name: 'GB Cerne',
        description: 'GB Cerne — Plataforma de Gestão Agrícola e Pecuária',
        theme_color: '#059669',
        background_color: '#064e3b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        orientation: 'landscape',
        display_override: ['standalone', 'window-controls-overlay'],
       icons,
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 15, // 15MB
        globPatterns: ['**/*.{js,css,html,ico,woff,woff2}'],
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    // 5173: porta padrão do Vite, já confiada pelo backend (CORS) e esperada
    // pelo launch.json. Auth por cookie exige que a origem do front esteja nos
    // domínios stateful do Sanctum (ver SANCTUM_STATEFUL_DOMAINS no backend).
    port: 5173,
    host: true,
    open: false,
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          chakra: ['@chakra-ui/react'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
