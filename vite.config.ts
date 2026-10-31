import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base ("./") is required for CrazyGames because they serve each
// game at a subpath. Absolute paths like "/assets/..." would 404.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Keep the bundle under CrazyGames' size limits — one JS, one CSS.
    // Inline small assets (< 8 KB) as base64 so there are fewer files to zip.
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        // Deterministic filenames make debugging the uploaded build easier.
        entryFileNames: 'assets/game.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (asset) => {
          const name = asset.name ?? '';
          if (name.endsWith('.css')) return 'assets/game.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
