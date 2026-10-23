import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
// Isolated mock preview: no production environment, data, or public assets.
export default defineConfig({
  root:fileURLToPath(new URL("./tests/previews/",import.meta.url)),
  envDir:false,publicDir:false,plugins:[react()],
  build:{outDir:fileURLToPath(new URL("./dist-document-preview/",import.meta.url)),emptyOutDir:true,rollupOptions:{input:fileURLToPath(new URL("./tests/previews/document-filters.html",import.meta.url))}},
});
