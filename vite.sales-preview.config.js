import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
// Only mock data and display components; no production env or public assets.
export default defineConfig({
  mode:"design-preview",
  root:fileURLToPath(new URL("./tests/previews/",import.meta.url)),
  envDir:false,publicDir:false,plugins:[react()],
  build:{outDir:fileURLToPath(new URL("./dist-sales-preview/",import.meta.url)),emptyOutDir:true,rollupOptions:{input:fileURLToPath(new URL("./tests/previews/sales-overview.html",import.meta.url))}},
});
