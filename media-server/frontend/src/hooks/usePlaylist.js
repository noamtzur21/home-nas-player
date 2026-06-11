import { useEffect, useState } from "react";
import { downloadTrackToDevice, deleteOfflineTrack } from "../utils/offlineStorage";

const STORAGE_KEY = "media-server-playlist";
const DEFAULT_ARTWORK = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80";

export function createTrack({ title, artist, sourceUrl, streamId, artwork }) {
  return {
    id: streamId || crypto.randomUUID(),
    title: title.trim(),
    artist: artist.trim(),
    sourceUrl: sourceUrl?.trim() || null,
    streamId: streamId?.trim() || null,
    artwork: artwork || DEFAULT_ARTWORK,
    isDownloaded: false,
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
  const [downloadingIds, setDownloadingIds] = useState(new Set());

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

    const alreadySaved = tracks.some(track => (trimmedStreamId && track.streamId === trimmedStreamId) || (trimmedUrl && track.sourceUrl === trimmedUrl));
    if (alreadySaved) return { ok: false, error: "This track is already in your playlist." };

    const track = createTrack({ title: trimmedTitle, artist: trimmedArtist, sourceUrl: trimmedUrl, streamId: trimmedStreamId, artwork });
    setTracks(current => [track, ...current]);
    return { ok: true, track };
  };

  const removeTrack = async (id) => {
    await deleteOfflineTrack(id);
    setTracks(current => current.filter(track => track.id !== id));
  };

  const downloadTrack = async (track) => {
    if (track.isDownloaded) return;
    setDownloadingIds(current => new Set([...current, track.id]));

    const streamEndpoint = import.meta.env.DEV ? "/stream" : "/api/stream";
    const params = new URLSearchParams(track.streamId ? { id: track.streamId } : { url: track.sourceUrl });
    const streamUrl = `${streamEndpoint}?${params.toString()}`;

    const success = await downloadTrackToDevice(track.id, streamUrl);

    if (success) {
      setTracks(current =>
        current.map(t => (t.id === track.id ? { ...t, isDownloaded: true } : t))
      );
    }

    setDownloadingIds(current => {
      const next = new Set(current);
      next.delete(track.id);
      return next;
    });
  };

  return { tracks, addTrack, removeTrack, downloadTrack, downloadingIds };
}