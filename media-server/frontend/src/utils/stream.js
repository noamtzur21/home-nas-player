import { getOfflineTrackUrl, hasOfflineTrack } from "./offlineStorage";
import { debugLog } from "./debugLog";

export async function buildStreamUrl(track) {
  debugLog("info", "buildStreamUrl start", { trackId: track.id, isLocal: track.isLocal });

  const offlineUrl = await getOfflineTrackUrl(track.id);
  if (offlineUrl) {
    debugLog("info", "Using offline blob URL");
    return offlineUrl;
  }

  if (track.isLocal || track.isDownloaded) {
    const stored = await hasOfflineTrack(track.id);
    if (!stored) {
      throw new Error("Offline file missing. Add the MP3 again.");
    }
  }

  debugLog("error", "No offline audio for track", { trackId: track.id });
  throw new Error("This song is not saved on your device.");
}

export function getInstantStreamUrl(track) {
  return track.id ? `offline://${track.id}` : "";
}

export function isResolvableEndpoint() {
  return false;
}

export async function resolvePlayableUrl(url) {
  return url;
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
