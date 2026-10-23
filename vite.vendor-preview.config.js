import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
// Only mock data and presentational components; no production env or public assets.
export default defineConfig({
  root:fileURLToPath(new URL("./tests/previews/",import.meta.url)),
  envDir:false,publicDir:false,plugins:[react()],
  build:{outDir:fileURLToPath(new URL("./dist-vendor-preview/",import.meta.url)),emptyOutDir:true,rollupOptions:{input:fileURLToPath(new URL("./tests/previews/vendor-filters.html",import.meta.url))}},
});
