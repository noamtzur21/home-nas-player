import { getOfflineTrackUrl } from "./offlineStorage";
import { debugLog } from "./debugLog";

const PUBLIC_BACKEND = (import.meta.env.VITE_STREAM_BACKEND_URL || "").replace(/\/$/, "");

function buildEndpoint(track) {
  if (track.streamId) {
    const params = `id=${encodeURIComponent(track.streamId)}`;
    if (import.meta.env.DEV) return `/stream?${params}`;
    if (PUBLIC_BACKEND) return `${PUBLIC_BACKEND}/stream?${params}`;
    return `/api/stream?${params}`;
  }

  if (track.sourceUrl) {
    const params = `url=${encodeURIComponent(track.sourceUrl)}`;
    if (import.meta.env.DEV) return `/stream?${params}`;
    if (PUBLIC_BACKEND) return `${PUBLIC_BACKEND}/stream?${params}`;
    return `/api/stream?${params}`;
  }

  return "";
}

export function getInstantStreamUrl(track) {
  return buildEndpoint(track);
}

export function isResolvableEndpoint(url) {
  return Boolean(url?.includes("/api/stream"));
}

export async function resolvePlayableUrl(url) {
  if (!url) return "";
  if (!isResolvableEndpoint(url)) return url;

  debugLog("info", "Resolving stream URL", { endpoint: url });

  const response = await fetch(url);
  const bodyText = await response.text();

  if (!response.ok) {
    debugLog("error", "Stream API failed", { status: response.status, body: bodyText.slice(0, 300) });
    throw new Error(`Stream API ${response.status}: ${bodyText.slice(0, 120)}`);
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    debugLog("error", "Stream API returned non-JSON", { body: bodyText.slice(0, 200) });
    throw new Error("Stream API returned invalid JSON");
  }

  if (!data.url) {
    debugLog("error", "Stream API missing url field", data);
    throw new Error(data.error || data.hint || "No playable stream URL returned");
  }

  debugLog("info", "Stream resolved", {
    source: data.source || "unknown",
    urlPreview: data.url.slice(0, 80),
  });

  return data.url;
}

export async function buildStreamUrl(track) {
  debugLog("info", "buildStreamUrl start", { trackId: track.id, streamId: track.streamId });

  const offlineUrl = await getOfflineTrackUrl(track.id);
  if (offlineUrl) {
    debugLog("info", "Using offline blob URL");
    return offlineUrl;
  }

  const endpoint = buildEndpoint(track);
  if (!endpoint) {
    debugLog("error", "No stream endpoint for track");
    return "";
  }

  if (import.meta.env.DEV || PUBLIC_BACKEND) {
    debugLog("info", "Direct backend stream", { endpoint: endpoint.slice(0, 100) });
    return endpoint;
  }

  return resolvePlayableUrl(endpoint);
}

export function searchResultToTrack(result) {
  return {
    id: result.id,
    title: result.title,
    artist: result.artist,
    artwork: result.thumbnail,
    streamId: result.id,
    durationLabel: result.duration,
  };
}
