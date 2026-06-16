import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const BACKEND = "http://127.0.0.1:3001";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "production"
      ? [
          VitePWA({
            registerType: "autoUpdate",
            manifest: {
              name: "Noam Music",
              short_name: "Noam Music",
              description: "Your personal music player with offline playback",
              categories: ["music", "entertainment"],
              display: "standalone",
              background_color: "#050505",
              theme_color: "#1db954",
              scope: "/",
              start_url: "/",
            },
            workbox: {
              cleanupOutdatedCaches: true,
              runtimeCaching: [],
              navigateFallback: "index.html",
              navigateFallbackDenylist: [/^\/api\//],
            },
          }),
        ]
      : []),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/stream": BACKEND,
      "/search": BACKEND,
      "/resolve": BACKEND,
      "/health": BACKEND,
    },
  },
}));
