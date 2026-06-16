import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import AudioPlayer from "./components/AudioPlayer.jsx";
import BottomNav from "./components/BottomNav.jsx";
import DebugPanel from "./components/DebugPanel.jsx";
import HomeScreen from "./components/HomeScreen.jsx";
import LibraryScreen from "./components/LibraryScreen.jsx";
import NowPlayingScreen from "./components/NowPlayingScreen.jsx";
import PlaylistPicker from "./components/PlaylistPicker.jsx";
import QueueSheet from "./components/QueueSheet.jsx";
import SearchScreen from "./components/SearchScreen.jsx";
import UploadProgress from "./components/UploadProgress.jsx";
import { useAudioPlayback } from "./hooks/useAudioPlayback.js";
import { usePersistentAudio } from "./hooks/usePersistentAudio.js";
import { usePlaylists } from "./hooks/usePlaylists.js";
import { useSearch } from "./hooks/useSearch.js";
import { useSuggestions } from "./hooks/useSuggestions.js";
import { debugLog, isDebugEnabled } from "./utils/debugLog.js";
import { hideNativeSplash } from "./utils/nativeShell.js";
import "./App.css";

export default function App() {
  const {
    playlists,
    activePlaylist,
    activePlaylistId,
    tracks,
    setActivePlaylistId,
    createNewPlaylist,
    deletePlaylistById,
    renamePlaylist,
    addLocalTrack,
    renameTrack,
    removeTrack,
    getPlaylistTracks,
    cloudStatus,
  } = usePlaylists();

  const {
    query,
    setQuery,
    results,
    isSearching,
    error: searchError,
    lastQuery,
    hasMore,
    runSearch,
    loadMore,
  } = useSearch();

  const { suggestions, isLoading: isLoadingSuggestions, error: suggestionsError, refresh, hasPlaylist } =
    useSuggestions(tracks);

  const { audioRef } = useAudioPlayback();

  const [activeTab, setActiveTab] = useState("home");
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueTracks, setQueueTracks] = useState([]);
  const [selectedSearchResultId, setSelectedSearchResultId] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // "off" | "all" | "one"

  useEffect(() => {
    setQueueTracks(tracks);
  }, [activePlaylistId, tracks]);

  const activeIndex = useMemo(
    () => queueTracks.findIndex((track) => track.id === activeTrack?.id),
    [queueTracks, activeTrack?.id],
  );

  const canWrap = repeatMode === "all" && queueTracks.length > 0;
  const hasPrevious = activeIndex > 0 || canWrap;
  const hasNext = (activeIndex >= 0 && activeIndex < queueTracks.length - 1) || canWrap;

  const selectTrack = useCallback((track, { queue, shouldAutoPlay = false } = {}) => {
    if (queue) {
      setQueueTracks(queue);
      setIsShuffled(false);
    }
    setActiveTrack(track);
    setActiveTab("home");
    setIsPlaying(shouldAutoPlay);
  }, []);

  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      selectTrack(queueTracks[activeIndex - 1], { shouldAutoPlay: true });
    } else if (canWrap) {
      selectTrack(queueTracks[queueTracks.length - 1], { shouldAutoPlay: true });
    }
  }, [activeIndex, canWrap, queueTracks, selectTrack]);

  const goToNext = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < queueTracks.length - 1) {
      selectTrack(queueTracks[activeIndex + 1], { shouldAutoPlay: true });
    } else if (canWrap) {
      selectTrack(queueTracks[0], { shouldAutoPlay: true });
    }
  }, [activeIndex, canWrap, queueTracks, selectTrack]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((wasShuffled) => {
      if (wasShuffled) {
        setQueueTracks(tracks);
      } else {
        setQueueTracks((current) => {
          const rest = current.filter((track) => track.id !== activeTrack?.id);
          for (let i = rest.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
          }
          const head = current.find((track) => track.id === activeTrack?.id);
          return head ? [head, ...rest] : rest;
        });
      }
      return !wasShuffled;
    });
  }, [activeTrack?.id, tracks]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));
  }, []);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    if (hasNext) {
      goToNext();
    } else {
      setIsPlaying(false);
    }
  }, [audioRef, goToNext, hasNext, repeatMode]);

  const {
    isLoading: isAudioLoading,
    playbackError,
    currentTime,
    duration,
    artworkUrl,
    seekTo,
    togglePlayPause,
  } = usePersistentAudio({
    audioRef,
    activeTrack,
    isPlaying,
    setIsPlaying,
    onTrackEnded: handleTrackEnded,
    hasNext,
    hasPrevious,
    onNext: goToNext,
    onPrevious: goToPrevious,
    queueIndex: activeIndex >= 0 ? activeIndex : 0,
    queueSize: queueTracks.length,
    playlistName: activePlaylist?.name || "Noam Spotify",
  });

  const handlePlayFromQueue = useCallback(
    (track, queue) => selectTrack(track, { queue, shouldAutoPlay: true }),
    [selectTrack],
  );

  const handleUploadMp3 = useCallback(
    async (payload) => {
      setUploadProgress({ percent: 0, label: "Starting..." });

      const result = await addLocalTrack({
        ...payload,
        onProgress: setUploadProgress,
      });

      setUploadProgress(null);

      if (result.ok) {
        const queue = getPlaylistTracks(payload.playlistId || activePlaylistId);
        handlePlayFromQueue(result.track, queue);
        return result;
      }

      setUploadProgress({ percent: 0, label: result.error || "Upload failed" });
      setTimeout(() => setUploadProgress(null), 2500);
      return result;
    },
    [addLocalTrack, getPlaylistTracks, activePlaylistId, handlePlayFromQueue],
  );

  const handleRemoveTrack = useCallback(
    async (trackId, playlistId) => {
      await removeTrack(trackId, playlistId);
      if (activeTrack?.id === trackId) {
        setActiveTrack(null);
        setIsPlaying(false);
      }
    },
    [removeTrack, activeTrack?.id],
  );

  const handleSelectSearchResult = useCallback((result) => {
    setSelectedSearchResultId(result.id);
  }, []);

  useEffect(() => {
    if (results.length > 0) {
      setSelectedSearchResultId(results[0].id);
    } else {
      setSelectedSearchResultId("");
    }
  }, [results]);

  useEffect(() => {
    debugLog("info", "App mounted", {
      debug: isDebugEnabled(),
      ua: navigator.userAgent,
      prod: import.meta.env.PROD,
    });
    hideNativeSplash();
  }, []);

  const handleClosePlayer = useCallback(() => {
    setIsPlayerExpanded(false);
    setIsQueueOpen(false);
  }, []);

  const showPlayer = Boolean(activeTrack);

  const shellClass = [
    "app-shell",
    showPlayer ? "app-shell--with-player" : "",
    isDebugEnabled() ? "app-shell--debug" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <DebugPanel />
      <UploadProgress progress={uploadProgress} />
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        className="global-audio"
        aria-hidden="true"
      />

      <main className="main-content">
        <AppHeader
          activePlaylistName={activePlaylist?.name || "My Playlist"}
          onOpenPlaylists={() => setShowPlaylistPicker(true)}
          cloudStatus={cloudStatus}
        />

        {activeTab === "home" ? (
          <HomeScreen
            activePlaylist={activePlaylist}
            tracks={tracks}
            activeTrackId={activeTrack?.id}
            onSelectTrack={(track) => handlePlayFromQueue(track, tracks)}
            onOpenPlaylist={() => setShowPlaylistPicker(true)}
            onAddTrack={handleUploadMp3}
            onRemoveTrack={(trackId) => handleRemoveTrack(trackId, activePlaylistId)}
            onRenameTrack={(trackId, fields) => renameTrack(trackId, fields, activePlaylistId)}
            isUploading={Boolean(uploadProgress)}
          />
        ) : null}

        {activeTab === "search" ? (
          <SearchScreen
            query={query}
            onQueryChange={setQuery}
            onSubmit={runSearch}
            isSearching={isSearching}
            lastQuery={lastQuery}
            results={results}
            searchError={searchError}
            selectedResultId={selectedSearchResultId}
            onSelectResult={handleSelectSearchResult}
            hasMore={hasMore}
            onLoadMore={loadMore}
            suggestions={suggestions}
            isLoadingSuggestions={isLoadingSuggestions}
            suggestionsError={suggestionsError}
            onRefreshSuggestions={refresh}
            showSuggestions={hasPlaylist}
          />
        ) : null}

        {activeTab === "library" ? (
          <LibraryScreen
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={setActivePlaylistId}
            onRemoveTrack={handleRemoveTrack}
            onRenameTrack={renameTrack}
            onUploadMp3={handleUploadMp3}
            onSelectTrack={(track, playlistId) => {
              const queue = getPlaylistTracks(playlistId);
              handlePlayFromQueue(track, queue);
            }}
            activeTrackId={activeTrack?.id}
            onCreatePlaylist={createNewPlaylist}
            isUploading={Boolean(uploadProgress)}
          />
        ) : null}
      </main>

      {showPlayer && !isPlayerExpanded ? (
        <AudioPlayer
          currentTrack={activeTrack}
          artworkUrl={artworkUrl}
          isPlaying={isPlaying}
          isLoading={isAudioLoading}
          currentTime={currentTime}
          duration={duration}
          onTogglePlayPause={togglePlayPause}
          onExpand={() => setIsPlayerExpanded(true)}
        />
      ) : null}

      {showPlayer && isPlayerExpanded ? (
        <NowPlayingScreen
          currentTrack={activeTrack}
          artworkUrl={artworkUrl}
          isPlaying={isPlaying}
          isLoading={isAudioLoading}
          playbackError={playbackError}
          currentTime={currentTime}
          duration={duration}
          onTogglePlayPause={togglePlayPause}
          onSeek={seekTo}
          onNext={goToNext}
          onPrevious={goToPrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onClose={handleClosePlayer}
          isShuffled={isShuffled}
          onToggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          onCycleRepeat={cycleRepeatMode}
          onOpenQueue={() => setIsQueueOpen(true)}
          onRenameTrack={(trackId, fields) => renameTrack(trackId, fields, activePlaylistId)}
        />
      ) : null}

      <QueueSheet
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queueTracks={queueTracks}
        activeTrackId={activeTrack?.id}
        onSelectTrack={(track) => selectTrack(track, { shouldAutoPlay: true })}
      />

      {!isPlayerExpanded ? <BottomNav activeTab={activeTab} onTabChange={setActiveTab} /> : null}

      <PlaylistPicker
        isOpen={showPlaylistPicker}
        onClose={() => setShowPlaylistPicker(false)}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={setActivePlaylistId}
        onCreatePlaylist={createNewPlaylist}
        onDeletePlaylist={deletePlaylistById}
        onRenamePlaylist={renamePlaylist}
      />
    </div>
  );
}
