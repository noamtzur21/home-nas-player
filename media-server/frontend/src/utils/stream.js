import { getOfflineTrackUrl } from "./offlineStorage";

export async function buildStreamUrl(track) {
  // 1. בודקים אם יש שיר באופליין בתוך המכשיר
  const offlineUrl = await getOfflineTrackUrl(track.id);
  if (offlineUrl) {
    console.log(`Playing ${track.title} from offline cache!`);
    return offlineUrl;
  }

  // 2. אם אין, פונים כרגיל לבקאנד
  if (track.streamId) {
    const params = new URLSearchParams({ id: track.streamId });
    return `/stream?${params.toString()}`;
  }

  if (track.sourceUrl) {
    const params = new URLSearchParams({ url: track.sourceUrl });
    return `/stream?${params.toString()}`;
  }

  return "";
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