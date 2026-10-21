import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Isolated mock-only design review: no app data, environment files or PWA.
export default defineConfig({
  root: fileURLToPath(new URL("./tests/previews/", import.meta.url)),
  envDir: false,
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./dist-contract-preview/", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL("./tests/previews/contract-overview.html", import.meta.url)) },
  },
});
