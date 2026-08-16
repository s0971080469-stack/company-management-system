import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32x32.png", "apple-touch-icon.png"],
      manifest: {
        name: "公司管理系統",
        short_name: "公司管理",
        description: "企業帳冊管理系統 — 人員、薪資、估價單、發票、收支管理",
        theme_color: "#1B2333",
        background_color: "#F3F3EF",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "zh-Hant",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // 只快取前端靜態資源（JS/CSS/HTML/圖示），不快取 Supabase API 回應，
        // 避免離線時看到過期資料、或誤以為離線也能新增/修改資料。
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
    }),
  ],
});
