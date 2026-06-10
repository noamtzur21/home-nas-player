import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // הגדרה שאומרת לדפדפן: כל פעם שמנגנים שיר מהשרת, תשמור עותק שלו בזיכרון המקומי
        runtimeCaching: [
          {
            urlPattern: /^\/stream.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "v2-spotify-mp3-cache",
              expiration: {
                maxEntries: 50, // כמות השירים המקסימלית שיישמרו באופליין
                maxAgeSeconds: 60 * 60 * 24 * 30, // שמור את השירים למשך 30 יום
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true, // פותח את החסימה ומאפשר לאייפון להיכנס
    proxy: {
      // הפניית הבקשות מהאייפון ישירות ל-IP של ה-Mac שבו רץ הבקאנד
      "/stream": "http://192.168.7.18:3001",
      "/search": "http://192.168.7.18:3001",
      "/health": "http://192.168.7.18:3001",
    },
  },
});