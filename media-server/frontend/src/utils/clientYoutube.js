import { debugLog } from "./debugLog";

function normalizeStreamUrl(data) {
  if (typeof data === "string") return data;
  if (data?.url) return data.url;
  if (data?.deciphered_url) return data.deciphered_url;
  return null;
}

export async function resolveStreamOnClient(videoId) {
  if (!videoId) throw new Error("Missing video id");

  debugLog("info", "Client-side YouTube resolve start", { videoId });

  const { ClientType, Innertube } = await import("youtubei.js");
  const yt = await Innertube.create({ client_type: ClientType.IOS });
  let lastError = "Client-side resolve failed";

  for (const type of ["audio", "video"]) {
    try {
      const data = await yt.getStreamingData(videoId, {
        type,
        quality: type === "audio" ? "best" : "360p",
      });
      const url = normalizeStreamUrl(data);
      if (!url) continue;

      debugLog("info", "Client-side YouTube resolve ok", {
        type,
        urlPreview: url.slice(0, 80),
      });
      return url;
    } catch (error) {
      lastError = error.message;
      debugLog("warn", `Client-side ${type} resolve failed`, { message: error.message });
    }
  }

  throw new Error(lastError);
}
