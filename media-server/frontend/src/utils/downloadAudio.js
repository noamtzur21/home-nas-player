import { saveTrackBlob } from "./offlineStorage";
import { debugLog } from "./debugLog";
import { readResponseWithProgress } from "./uploadProgress";

async function readStreamToBlob(stream, mimeType = "audio/mp4", onChunkProgress) {
  const reader = stream.getReader();
  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (onChunkProgress) {
      onChunkProgress(Math.min(0.99, loaded / (loaded + 256 * 1024)));
    }
  }

  if (onChunkProgress) onChunkProgress(1);
  return new Blob(chunks, { type: mimeType });
}

async function downloadViaStreamApi(videoId, onChunkProgress) {
  debugLog("info", "Downloading via /api/stream proxy", { videoId });

  const response = await fetch(`/api/stream?id=${encodeURIComponent(videoId)}`);
  const data = await response.json();
  if (!response.ok || !data.url) {
    throw new Error(data.error || data.detail || `Stream API ${response.status}`);
  }

  if (data.url.startsWith("/api/audio")) {
    return downloadViaAudioProxy(videoId, onChunkProgress);
  }

  const audioResponse = await fetch(data.url);
  if (!audioResponse.ok) {
    throw new Error(`Proxy audio fetch ${audioResponse.status}`);
  }

  return readResponseWithProgress(audioResponse, onChunkProgress || (() => {}));
}

async function downloadViaYoutubei(videoId, onChunkProgress) {
  debugLog("info", "Downloading via youtubei.js", { videoId });

  const { ClientType, Innertube } = await import("youtubei.js");
  const yt = await Innertube.create({ client_type: ClientType.IOS });
  const stream = await yt.download(videoId, { type: "audio", quality: "best" });
  return readStreamToBlob(stream, "audio/mp4", onChunkProgress);
}

async function downloadViaRenderBackend(videoId, onChunkProgress) {
  const backendUrl =
    import.meta.env.VITE_STREAM_BACKEND_URL || "https://media-server-backend-lwi0.onrender.com";
  debugLog("info", "Downloading via Render backend (yt-dlp)", { videoId, backendUrl });
  const response = await fetch(`${backendUrl}/stream?id=${encodeURIComponent(videoId)}`, {
    signal: AbortSignal.timeout(240000),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Render backend failed (${response.status}): ${body.slice(0, 80)}`);
  }
  return readResponseWithProgress(response, onChunkProgress || (() => {}));
}

async function downloadViaAudioProxy(videoId, onChunkProgress) {
  debugLog("info", "Downloading via /api/audio", { videoId });
  const response = await fetch(`/api/audio?id=${encodeURIComponent(videoId)}`);
  if (!response.ok) {
    throw new Error(`Audio proxy failed (${response.status})`);
  }
  return readResponseWithProgress(response, onChunkProgress || (() => {}));
}

async function downloadViaDownloadApi(videoId, onChunkProgress) {
  debugLog("info", "Downloading via /api/download", { videoId });
  const response = await fetch(`/api/download?id=${encodeURIComponent(videoId)}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Download API failed (${response.status}): ${body.slice(0, 80)}`);
  }
  return readResponseWithProgress(response, onChunkProgress || (() => {}));
}

export async function downloadSearchResultToDevice(result, { onProgress } = {}) {
  if (!result?.id) throw new Error("Missing video id");

  const errors = [];
  const reportDownload = (ratio) => {
    onProgress?.({
      percent: Math.round(8 + ratio * 82),
      label: "Downloading audio...",
    });
  };

  onProgress?.({ percent: 2, label: "Starting download..." });

  for (const attempt of [
    () => downloadViaRenderBackend(result.id, reportDownload),
    () => downloadViaAudioProxy(result.id, reportDownload),
    () => downloadViaYoutubei(result.id, reportDownload),
    () => downloadViaDownloadApi(result.id, reportDownload),
  ]) {
    try {
      const blob = await attempt();
      if (!blob?.size) throw new Error("Empty audio file");
      onProgress?.({ percent: 92, label: "Saving to device..." });
      await saveTrackBlob(result.id, blob);
      onProgress?.({ percent: 100, label: "Done!" });
      debugLog("info", "Track saved offline", { trackId: result.id, bytes: blob.size });
      return blob;
    } catch (error) {
      errors.push(error.message);
      debugLog("warn", "Download attempt failed", { message: error.message });
    }
  }

  throw new Error(errors.join(" | ") || "Download failed");
}
