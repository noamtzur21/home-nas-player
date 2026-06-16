import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native iOS wrapper for the existing Noam Spotify web app.
 * The React app lives in ../media-server/frontend — we only copy its build output here.
 *
 * Optional: load from Vercel instead of bundled files (comment webDir, uncomment server):
 *   server: { url: "https://YOUR-VERCEL-URL.vercel.app", cleartext: false }
 */
const config: CapacitorConfig = {
  appId: "com.noam.spotify",
  appName: "Noam Spotify",
  webDir: "web-dist",
  ios: {
    contentInset: "automatic",
    backgroundColor: "#050505",
    allowsLinkPreview: false,
    scrollEnabled: false,
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#050505",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050505",
    },
  },
};

export default config;
