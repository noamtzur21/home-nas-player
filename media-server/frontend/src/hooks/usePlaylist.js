import { useEffect, useState } from "react";
import { deleteOfflineTrack, saveTrackBlob } from "../utils/offlineStorage";

const STORAGE_KEY = "media-server-playlist";
const DEFAULT_ARTWORK = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80";

export function createTrack({ title, artist, sourceUrl, streamId, artwork, isLocal = false }) {
  return {
    id: streamId || crypto.randomUUID(),
    title: title.trim(),
    artist: artist.trim(),
    sourceUrl: sourceUrl?.trim() || null,
    streamId: streamId?.trim() || null,
    artwork: artwork || DEFAULT_ARTWORK,
    isDownloaded: isLocal,
    isLocal,
    createdAt: Date.now(),
  };
}

function loadPlaylist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePlaylist(tracks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
}

export function usePlaylist() {
  const [tracks, setTracks] = useState(loadPlaylist);

  useEffect(() => {
    savePlaylist(tracks);
  }, [tracks]);

  const addTrack = ({ title, artist, sourceUrl, streamId, artwork }) => {
    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim();
    const trimmedUrl = sourceUrl?.trim() || "";
    const trimmedStreamId = streamId?.trim() || "";

    if (!trimmedTitle || !trimmedArtist) return { ok: false, error: "Title and artist are required." };
    if (!trimmedUrl && !trimmedStreamId) return { ok: false, error: "A media URL or stream id is required." };

    const alreadySaved = tracks.some(
      (track) =>
        (trimmedStreamId && track.streamId === trimmedStreamId) ||
        (trimmedUrl && track.sourceUrl === trimmedUrl),
    );
    if (alreadySaved) return { ok: false, error: "This track is already in your playlist." };

    const track = createTrack({
      title: trimmedTitle,
      artist: trimmedArtist,
      sourceUrl: trimmedUrl,
      streamId: trimmedStreamId,
      artwork,
    });
    setTracks((current) => [track, ...current]);
    return { ok: true, track };
  };

  const addLocalTrack = async ({ file, title, artist }) => {
    if (!file) return { ok: false, error: "No file selected." };

    const trimmedTitle = title?.trim() || file.name.replace(/\.[^.]+$/, "");
    const trimmedArtist = artist?.trim() || "Local upload";
    const id = crypto.randomUUID();

    await saveTrackBlob(id, file);

    const track = {
      id,
      title: trimmedTitle,
      artist: trimmedArtist,
      sourceUrl: null,
      streamId: null,
      artwork: DEFAULT_ARTWORK,
      isDownloaded: true,
      isLocal: true,
      createdAt: Date.now(),
    };

    setTracks((current) => [track, ...current]);
    return { ok: true, track };
  };

  const removeTrack = async (id) => {
    await deleteOfflineTrack(id);
    setTracks((current) => current.filter((track) => track.id !== id));
  };

  return { tracks, addTrack, addLocalTrack, removeTrack };
}
