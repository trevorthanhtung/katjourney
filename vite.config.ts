import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["asset/favicon.ico", "asset/apple-touch-icon.png"],
      manifest: {
        name: "KAT Journey",
        short_name: "KAT Journey",
        description: "Lên kế hoạch chuyến đi gọn gàng, theo dõi lịch trình, checklist, chi phí và lưu lại kỷ niệm du lịch.",
        theme_color: "#00BFB7",
        background_color: "#FAF7F1",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/asset/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/asset/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/asset/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      }
    })
  ],
  esbuild: {
    drop: ['console', 'debugger'],
  }
});
