import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Mock-only static review. No production entry point, env files, or public assets.
export default defineConfig({
  mode: 'design-preview',
  root: fileURLToPath(new URL('./tests/previews/', import.meta.url)),
  envDir: false,
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist-compact-preview/', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: Object.fromEntries(['dashboard-overview','website-management','billing-overview'].map(name => [name,fileURLToPath(new URL(`./tests/previews/${name}.html`,import.meta.url))])) },
  },
});
