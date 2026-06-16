import { downloadTrackToDevice, getOfflineTrackUrl, hasOfflineTrack } from "./offlineStorage";
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
      // Not on this device yet (e.g. a new phone) — pull it from the cloud
      // backup once and cache it locally for next time.
      if (track.cloudAudioUrl) {
        debugLog("info", "Fetching track from cloud backup", { trackId: track.id });
        const fetched = await downloadTrackToDevice(track.id, track.cloudAudioUrl);
        if (fetched) {
          const cachedUrl = await getOfflineTrackUrl(track.id);
          if (cachedUrl) return cachedUrl;
        }
      }
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
