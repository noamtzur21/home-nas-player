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
            workbox: {
              runtimeCaching: [
                {
                  urlPattern: /^\/api\/stream.*/,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "v2-spotify-mp3-cache",
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                    cacheableResponse: {
                      statuses: [0, 200],
                    },
                  },
                },
              ],
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
