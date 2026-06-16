import { get, set, del } from "idb-keyval";

const STORAGE_PREFIX = "track-";
const ARTWORK_PREFIX = "artwork-";

export function trackStorageKey(trackId) {
  return `${STORAGE_PREFIX}${trackId}`;
}

function artworkStorageKey(trackId) {
  return `${ARTWORK_PREFIX}${trackId}`;
}

const artworkUrlCache = new Map();

export async function saveTrackArtwork(trackId, imageUrl) {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return imageUrl;

    const blob = await response.blob();
    await set(artworkStorageKey(trackId), blob);
    const url = URL.createObjectURL(blob);
    artworkUrlCache.set(trackId, url);
    return url;
  } catch {
    return imageUrl;
  }
}

export async function getArtworkUrl(trackId, fallbackUrl) {
  try {
    const cached = artworkUrlCache.get(trackId);
    if (cached) return cached;

    const blob = await get(artworkStorageKey(trackId));
    if (blob) {
      const url = URL.createObjectURL(blob);
      artworkUrlCache.set(trackId, url);
      return url;
    }
  } catch {
    /* fall through */
  }

  return fallbackUrl;
}

export async function deleteOfflineTrack(trackId) {
  revokeOfflineTrackUrl(trackId);
  const artworkUrl = artworkUrlCache.get(trackId);
  if (artworkUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(artworkUrl);
  }
  artworkUrlCache.delete(trackId);
  await del(trackStorageKey(trackId));
  await del(artworkStorageKey(trackId));
}

export async function saveTrackBlob(trackId, blob) {
  await set(trackStorageKey(trackId), blob);
}

export async function hasOfflineTrack(trackId) {
  try {
    const blob = await get(trackStorageKey(trackId));
    return Boolean(blob && blob.size > 0);
  } catch {
    return false;
  }
}

export async function getOfflineTrackBlob(trackId) {
  try {
    const blob = await get(trackStorageKey(trackId));
    if (!blob || !blob.size) return null;
    return blob;
  } catch {
    return null;
  }
}

const blobUrlCache = new Map();

export async function getOfflineTrackUrl(trackId) {
  try {
    const cached = blobUrlCache.get(trackId);
    if (cached) return cached;

    const blob = await getOfflineTrackBlob(trackId);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    blobUrlCache.set(trackId, url);
    return url;
  } catch {
    return null;
  }
}

export function revokeOfflineTrackUrl(trackId) {
  const url = blobUrlCache.get(trackId);
  if (url) {
    URL.revokeObjectURL(url);
    blobUrlCache.delete(trackId);
  }
}

export async function downloadTrackToDevice(trackId, streamUrl) {
  try {
    const response = await fetch(streamUrl);
    if (!response.ok) throw new Error("Failed to fetch audio file");

    const blob = await response.blob();
    await saveTrackBlob(trackId, blob);
    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
}

export async function syncLibraryOfflineFlags(library) {
  const playlists = await Promise.all(
    library.playlists.map(async (playlist) => ({
      ...playlist,
      tracks: await Promise.all(
        playlist.tracks.map(async (track) => {
          const stored = await hasOfflineTrack(track.id);
          if (stored) {
            return { ...track, isLocal: true, isDownloaded: true };
          }
          if (track.isLocal || track.isDownloaded) {
            return { ...track, isDownloaded: false };
          }
          return track;
        }),
      ),
    })),
  );

  return { ...library, playlists };
}
