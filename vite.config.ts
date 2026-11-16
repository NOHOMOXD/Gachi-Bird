import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
