import { defineConfig } from 'vite';

export default defineConfig({
  // Garantir que variáveis VITE_ estejam disponíveis
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    // Proxy para API routes em desenvolvimento local
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
