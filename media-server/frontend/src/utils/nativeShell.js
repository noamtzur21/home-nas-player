export function hideNativeSplash() {
  try {
    const splash = window.Capacitor?.Plugins?.SplashScreen;
    if (splash?.hide) {
      splash.hide();
    }
  } catch {
    /* not running inside Capacitor */
  }
}

export function isNativeShell() {
  return Boolean(window.Capacitor?.isNativePlatform?.() || window.location.protocol === "capacitor:");
}
