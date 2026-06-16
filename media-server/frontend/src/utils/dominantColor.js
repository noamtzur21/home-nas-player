// Best-effort average-color extraction from cover art, used to give the
// player a Spotify-like per-track tint. Many thumbnail hosts (YouTube's
// included) don't send CORS headers, which taints the canvas and blocks
// pixel reads — that's expected and handled by falling back to null so
// callers can use a fixed brand gradient instead.
export function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl.startsWith("data:")) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }

        resolve({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export function rgbString({ r, g, b }, alpha = 1) {
  return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

export function darken({ r, g, b }, factor = 0.35) {
  return { r: Math.round(r * factor), g: Math.round(g * factor), b: Math.round(b * factor) };
}
