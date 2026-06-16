/**
 * Converts blob/local artwork to a data URL so iOS lock screen & Control Center can show it.
 */
export async function resolveMediaSessionArtwork(url) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  if (url.startsWith("blob:")) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return url;
    }
  }

  return url;
}

export function buildMediaSessionArtwork(src) {
  if (!src) return [];
  return [
    { src, sizes: "96x96", type: "image/jpeg" },
    { src, sizes: "128x128", type: "image/jpeg" },
    { src, sizes: "192x192", type: "image/jpeg" },
    { src, sizes: "256x256", type: "image/jpeg" },
    { src, sizes: "512x512", type: "image/jpeg" },
  ];
}
