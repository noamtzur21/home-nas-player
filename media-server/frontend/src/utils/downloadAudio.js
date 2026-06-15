import { set } from "idb-keyval";
import { debugLog } from "./debugLog";

const STORAGE_PREFIX = "track-";

export async function saveTrackBlob(trackId, blob) {
  await set(`${STORAGE_PREFIX}${trackId}`, blob);
}

async function readStreamToBlob(stream, mimeType = "audio/mp4") {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return new Blob(chunks, { type: mimeType });
}

async function downloadViaStreamApi(videoId) {
  debugLog("info", "Downloading via /api/stream proxy", { videoId });

  const response = await fetch(`/api/stream?id=${encodeURIComponent(videoId)}`);
  const data = await response.json();
  if (!response.ok || !data.url) {
    throw new Error(data.error || data.detail || `Stream API ${response.status}`);
  }

  if (data.url.startsWith("/api/audio")) {
    return downloadViaAudioProxy(videoId);
  }

  const audioResponse = await fetch(data.url);
  if (!audioResponse.ok) {
    throw new Error(`Proxy audio fetch ${audioResponse.status}`);
  }

  return audioResponse.blob();
}

async function downloadViaYoutubei(videoId) {
  debugLog("info", "Downloading via youtubei.js", { videoId });

  const { ClientType, Innertube } = await import("youtubei.js");
  const yt = await Innertube.create({ client_type: ClientType.IOS });
  const stream = await yt.download(videoId, { type: "audio", quality: "best" });
  return readStreamToBlob(stream, "audio/mp4");
}

async function downloadViaRenderBackend(videoId) {
  const backendUrl =
    import.meta.env.VITE_STREAM_BACKEND_URL || "https://media-server-backend-lwi0.onrender.com";
  debugLog("info", "Downloading via Render backend (yt-dlp)", { videoId, backendUrl });
  const response = await fetch(`${backendUrl}/stream?id=${encodeURIComponent(videoId)}`, {
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Render backend failed (${response.status}): ${body.slice(0, 80)}`);
  }
  return response.blob();
}

async function downloadViaAudioProxy(videoId) {
  debugLog("info", "Downloading via /api/audio", { videoId });
  const response = await fetch(`/api/audio?id=${encodeURIComponent(videoId)}`);
  if (!response.ok) {
    throw new Error(`Audio proxy failed (${response.status})`);
  }
  return response.blob();
}

async function downloadViaDownloadApi(videoId) {
  debugLog("info", "Downloading via /api/download", { videoId });
  const response = await fetch(`/api/download?id=${encodeURIComponent(videoId)}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Download API failed (${response.status}): ${body.slice(0, 80)}`);
  }
  return response.blob();
}

export async function downloadSearchResultToDevice(result) {
  if (!result?.id) throw new Error("Missing video id");

  const errors = [];

  // Note: downloadViaStreamApi is intentionally skipped — it returns YouTube CDN URLs
  // that cannot be fetched as blobs from the browser due to CORS. Always proxy through
  // Vercel (/api/audio or /api/download) to avoid CORS failures on mobile.
  for (const attempt of [
    () => downloadViaRenderBackend(result.id),
    () => downloadViaAudioProxy(result.id),
    () => downloadViaYoutubei(result.id),
    () => downloadViaDownloadApi(result.id),
  ]) {
    try {
      const blob = await attempt();
      if (!blob?.size) throw new Error("Empty audio file");
      await saveTrackBlob(result.id, blob);
      debugLog("info", "Track saved offline", { trackId: result.id, bytes: blob.size });
      return blob;
    } catch (error) {
      errors.push(error.message);
      debugLog("warn", "Download attempt failed", { message: error.message });
    }
  }

  throw new Error(errors.join(" | ") || "Download failed");
}
