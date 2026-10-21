import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Isolated design review: no AuthGate, App, Supabase client, env files, or PWA.
export default defineConfig({
  root: fileURLToPath(new URL("./tests/previews/", import.meta.url)),
  envDir: false,
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./dist-billing-preview/", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL("./tests/previews/billing-overview.html", import.meta.url)) },
  },
});
