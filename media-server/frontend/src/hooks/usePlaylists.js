import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteOfflineTrack,
  hasOfflineTrack,
  saveTrackBlob,
  saveTrackArtwork,
  syncLibraryOfflineFlags,
} from "../utils/offlineStorage";
import { DEFAULT_OFFLINE_ARTWORK } from "../utils/defaultArtwork";
import { lookupTrackMetadata } from "../utils/trackMetadata";
import { createSmoothProgress, saveTrackBlobWithProgress } from "../utils/uploadProgress";

const LIBRARY_KEY = "noam-spotify-library";
const LEGACY_KEY = "media-server-playlist";

const PLAYLIST_GRADIENTS = [
  "linear-gradient(135deg, #1db954 0%, #191414 100%)",
  "linear-gradient(135deg, #509bf5 0%, #1e3264 100%)",
  "linear-gradient(135deg, #e91429 0%, #450a0a 100%)",
  "linear-gradient(135deg, #8d67ab 0%, #2d1b4e 100%)",
  "linear-gradient(135deg, #f59b23 0%, #503000 100%)",
  "linear-gradient(135deg, #148a08 0%, #0a2810 100%)",
];

export function createTrack({ title, artist, sourceUrl, streamId, artwork, isLocal = false }) {
  return {
    id: streamId || crypto.randomUUID(),
    title: title.trim(),
    artist: artist.trim(),
    sourceUrl: sourceUrl?.trim() || null,
    streamId: streamId?.trim() || null,
    artwork: artwork || DEFAULT_OFFLINE_ARTWORK,
    isDownloaded: isLocal,
    isLocal,
    createdAt: Date.now(),
  };
}

function createPlaylist(name) {
  const id = crypto.randomUUID();
  return {
    id,
    name: name.trim() || "My Playlist",
    tracks: [],
    gradient: PLAYLIST_GRADIENTS[Math.floor(Math.random() * PLAYLIST_GRADIENTS.length)],
    createdAt: Date.now(),
  };
}

function migrateLegacyLibrary() {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return null;

    const legacyTracks = JSON.parse(legacyRaw);
    if (!Array.isArray(legacyTracks) || !legacyTracks.length) return null;

    const library = {
      playlists: [{ ...createPlaylist("My Playlist"), tracks: legacyTracks }],
      activePlaylistId: null,
    };
    library.activePlaylistId = library.playlists[0].id;
    localStorage.removeItem(LEGACY_KEY);
    return library;
  } catch {
    return null;
  }
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.playlists?.length) {
        return {
          playlists: parsed.playlists,
          activePlaylistId: parsed.activePlaylistId || parsed.playlists[0].id,
        };
      }
    }
  } catch {
    /* fall through */
  }

  const migrated = migrateLegacyLibrary();
  if (migrated) return migrated;

  const defaultPlaylist = createPlaylist("My Playlist");
  return {
    playlists: [defaultPlaylist],
    activePlaylistId: defaultPlaylist.id,
  };
}

function saveLibrary(library) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function usePlaylists() {
  const [library, setLibrary] = useState(loadLibrary);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    syncLibraryOfflineFlags(library).then((synced) => {
      if (cancelled) return;
      setLibrary(synced);
      setIsSyncing(false);
    });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isSyncing) return;
    saveLibrary(library);
  }, [library, isSyncing]);

  const activePlaylist = useMemo(
    () => library.playlists.find((playlist) => playlist.id === library.activePlaylistId) || library.playlists[0],
    [library],
  );

  const tracks = activePlaylist?.tracks ?? [];

  const updateActivePlaylist = useCallback((updater) => {
    setLibrary((current) => {
      const activeId = current.activePlaylistId || current.playlists[0]?.id;
      return {
        ...current,
        playlists: current.playlists.map((playlist) =>
          playlist.id === activeId ? updater(playlist) : playlist,
        ),
      };
    });
  }, []);

  const setActivePlaylistId = useCallback((id) => {
    setLibrary((current) => ({ ...current, activePlaylistId: id }));
  }, []);

  const createNewPlaylist = useCallback((name) => {
    const playlist = createPlaylist(name);
    setLibrary((current) => ({
      playlists: [playlist, ...current.playlists],
      activePlaylistId: playlist.id,
    }));
    return playlist;
  }, []);

  const deletePlaylistById = useCallback(async (id) => {
    const target = library.playlists.find((playlist) => playlist.id === id);
    if (!target) return { ok: false, error: "Playlist not found." };
    if (library.playlists.length <= 1) return { ok: false, error: "Keep at least one playlist." };

    for (const track of target.tracks) {
      await deleteOfflineTrack(track.id);
    }

    setLibrary((current) => {
      const nextPlaylists = current.playlists.filter((playlist) => playlist.id !== id);
      const nextActive =
        current.activePlaylistId === id ? nextPlaylists[0]?.id : current.activePlaylistId;
      return { playlists: nextPlaylists, activePlaylistId: nextActive };
    });

    return { ok: true };
  }, [library.playlists]);

  const renamePlaylist = useCallback((id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Name is required." };

    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === id ? { ...playlist, name: trimmed } : playlist,
      ),
    }));

    return { ok: true };
  }, []);

  const addTrack = useCallback(
    ({ title, artist, sourceUrl, streamId, artwork, playlistId }) => {
      const trimmedTitle = title.trim();
      const trimmedArtist = artist.trim();
      const trimmedUrl = sourceUrl?.trim() || "";
      const trimmedStreamId = streamId?.trim() || "";
      const targetId = playlistId || library.activePlaylistId;

      if (!trimmedTitle || !trimmedArtist) return { ok: false, error: "Title and artist are required." };
      if (!trimmedUrl && !trimmedStreamId) return { ok: false, error: "A media URL or stream id is required." };

      const targetPlaylist = library.playlists.find((playlist) => playlist.id === targetId);
      if (!targetPlaylist) return { ok: false, error: "Playlist not found." };

      const alreadySaved = targetPlaylist.tracks.some(
        (track) =>
          (trimmedStreamId && track.streamId === trimmedStreamId) ||
          (trimmedUrl && track.sourceUrl === trimmedUrl),
      );
      if (alreadySaved) return { ok: false, error: "This track is already in the playlist." };

      const track = createTrack({
        title: trimmedTitle,
        artist: trimmedArtist,
        sourceUrl: trimmedUrl,
        streamId: trimmedStreamId,
        artwork,
      });

      setLibrary((current) => ({
        ...current,
        playlists: current.playlists.map((playlist) =>
          playlist.id === targetId ? { ...playlist, tracks: [track, ...playlist.tracks] } : playlist,
        ),
      }));

      return { ok: true, track };
    },
    [library],
  );

  const addLocalTrack = useCallback(
    async ({ file, title, artist, playlistId, onProgress }) => {
      if (!file) return { ok: false, error: "No file selected." };

      const targetId = playlistId || library.activePlaylistId;
      const progress = createSmoothProgress(onProgress || (() => {}));
      const id = crypto.randomUUID();

      try {
        progress.set(2, "Preparing...");

        const metadata = await lookupTrackMetadata(file.name);
        progress.set(8, "Found song info...");

        const trimmedTitle = title?.trim() || metadata.title;
        const trimmedArtist =
          metadata.artist && metadata.artist !== "Unknown Artist"
            ? metadata.artist
            : artist?.trim() || metadata.artist;

        progress.set(10, "Saving audio to device...");

        await saveTrackBlobWithProgress(id, file, saveTrackBlob, (ratio) => {
          progress.set(10 + ratio * 72, "Saving audio to device...");
        });

        progress.set(84, "Verifying storage...");

        const stored = await hasOfflineTrack(id);
        if (!stored) {
          await deleteOfflineTrack(id);
          return { ok: false, error: "Could not save the song for offline playback." };
        }

        progress.set(88, "Downloading cover art...");
        const artwork =
          (metadata.artwork && (await saveTrackArtwork(id, metadata.artwork))) ||
          metadata.artwork ||
          DEFAULT_OFFLINE_ARTWORK;

        progress.set(94, "Adding to playlist...");

        const track = {
          id,
          title: trimmedTitle,
          artist: trimmedArtist,
          sourceUrl: null,
          streamId: metadata.streamId || null,
          artwork,
          isDownloaded: true,
          isLocal: true,
          fileSize: file.size,
          createdAt: Date.now(),
        };

        setLibrary((current) => ({
          ...current,
          playlists: current.playlists.map((playlist) =>
            playlist.id === targetId ? { ...playlist, tracks: [track, ...playlist.tracks] } : playlist,
          ),
        }));

        progress.set(100, "Done!");
        return { ok: true, track };
      } catch (error) {
        await deleteOfflineTrack(id);
        return { ok: false, error: error.message || "Upload failed" };
      }
    },
    [library.activePlaylistId],
  );

  const removeTrack = useCallback(async (trackId, playlistId) => {
    const targetId = playlistId || library.activePlaylistId;
    await deleteOfflineTrack(trackId);

    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === targetId
          ? { ...playlist, tracks: playlist.tracks.filter((track) => track.id !== trackId) }
          : playlist,
      ),
    }));
  }, [library.activePlaylistId]);

  const getPlaylistTracks = useCallback(
    (playlistId) => library.playlists.find((playlist) => playlist.id === playlistId)?.tracks ?? [],
    [library.playlists],
  );

  return {
    playlists: library.playlists,
    activePlaylist,
    activePlaylistId: library.activePlaylistId,
    tracks,
    setActivePlaylistId,
    createNewPlaylist,
    deletePlaylistById,
    renamePlaylist,
    addTrack,
    addLocalTrack,
    removeTrack,
    getPlaylistTracks,
    updateActivePlaylist,
  };
}
