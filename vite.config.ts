import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages org site (anten-tv.github.io) — served at domain root
export default defineConfig({
  base: "/",
  server: {
    port: 4123,
  },
  build: {
    // maplibre-gl is a single ~1 MB module; it's lazy-loaded (MapView chunk)
    // so the default 500 kB entry-size warning doesn't apply
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          // stable vendor chunk — app code changes don't bust its cache
          "react-vendor": ["react", "react-dom", "react-dom/client"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
      manifest: {
        name: "Anten VN — Dò sóng DVB-T2",
        short_name: "Anten VN",
        description:
          "Tìm trạm phát sóng truyền hình số mặt đất DVB-T2 gần bạn và chỉnh hướng ăng-ten",
        lang: "vi",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
        runtimeCaching: [
          {
            // Live tower data — stale-while-revalidate so merged data PRs
            // reach installed apps on next online open, no redeploy needed
            urlPattern:
              /^https:\/\/raw\.githubusercontent\.com\/.*\/anten-tv\.github\.io\/.*\/data\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "tower-data",
              expiration: { maxEntries: 100 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Style JSON + TileJSON must stay fresh — a CacheFirst-pinned
            // style can reference dated tile snapshots the server deleted.
            // (First matching route wins, so this must precede the tile rule.)
            urlPattern:
              /^https:\/\/tiles\.openfreemap\.org\/(styles|planet)[^/]*\/?$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "map-style",
              expiration: { maxEntries: 10 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OpenFreeMap vector tiles, glyphs, sprites — visited areas work offline
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 604800 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
