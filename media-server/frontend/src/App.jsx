import { useCallback, useEffect, useMemo, useState } from "react";
import AddTrackForm from "./components/AddTrackForm.jsx";
import AudioPlayer from "./components/AudioPlayer.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SearchResults from "./components/SearchResults.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TrackList from "./components/TrackList.jsx";
import { useAudioPlayback } from "./hooks/useAudioPlayback.js";
import { usePlaylist } from "./hooks/usePlaylist.js";
import { useSearch } from "./hooks/useSearch.js";
import { searchResultToTrack } from "./utils/stream.js";
import { debugLog, isDebugEnabled } from "./utils/debugLog.js";
import DebugPanel from "./components/DebugPanel.jsx";
import "./App.css";

export default function App() {
  // חילצנו פה את פונקציית ההורדה ואת הסטוסים של הטעינה לאופליין מההוק המעודכן
  const { 
    tracks, 
    addTrack, 
    removeTrack, 
    downloadTrack, 
    downloadingIds 
  } = usePlaylist();
  
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

  const { audioRef, playTrackWithGesture } = useAudioPlayback();

  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);
  const [playlistMessage, setPlaylistMessage] = useState("");

  const activeIndex = useMemo(
    () => tracks.findIndex((track) => track.id === activeTrack?.id),
    [tracks, activeTrack?.id]
  );

  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < tracks.length - 1;

  const selectTrack = useCallback(async (track, { shouldAutoPlay = false } = {}) => {
    setActiveTrack(track);

    if (!shouldAutoPlay) {
      setIsPlaying(false);
      return;
    }

    const { ok } = await playTrackWithGesture(track);
    setIsPlaying(ok);
  }, [playTrackWithGesture]);

  const handleAddTrack = useCallback(async (values) => {
    const result = addTrack(values);
    if (result.ok) {
      setPlaylistMessage("");
      await selectTrack(result.track, { shouldAutoPlay: true });
    }
    return result;
  }, [addTrack, selectTrack]);

  const handleRemoveTrack = useCallback((id) => {
    removeTrack(id);
    if (activeTrack?.id === id) {
      setActiveTrack(null);
      setIsPlaying(false);
    }
  }, [removeTrack, activeTrack?.id]);

  const handlePlaySearchResult = useCallback(
    async (result) => {
      await selectTrack(searchResultToTrack(result), { shouldAutoPlay: true });
    },
    [selectTrack]
  );

  const handleAddSearchResult = useCallback(
    (result) => {
      const addResult = addTrack({
        title: result.title,
        artist: result.artist,
        streamId: result.id,
        artwork: result.thumbnail,
      });

      if (addResult.ok) {
        setPlaylistMessage(`Added "${result.title}" to your playlist.`);
      } else {
        setPlaylistMessage(addResult.error);
      }
    },
    [addTrack]
  );

  const goToPrevious = useCallback(async () => {
    if (!hasPrevious) return;
    await selectTrack(tracks[activeIndex - 1], { shouldAutoPlay: true });
  }, [activeIndex, hasPrevious, selectTrack, tracks]);

  const goToNext = useCallback(async () => {
    if (!hasNext) return;
    await selectTrack(tracks[activeIndex + 1], { shouldAutoPlay: true });
  }, [activeIndex, hasNext, selectTrack, tracks]);

  const handleTrackEnded = useCallback(() => {
    if (hasNext) {
      goToNext();
    } else {
      setIsPlaying(false);
    }
  }, [goToNext, hasNext]);

  useEffect(() => {
    debugLog("info", "App mounted", {
      debug: isDebugEnabled(),
      ua: navigator.userAgent,
      prod: import.meta.env.PROD,
    });
  }, []);

  return (
    <div className={`app-shell${activeTrack ? " app-shell--with-player" : ""}${isDebugEnabled() ? " app-shell--debug" : ""}`}>
      <DebugPanel />
      <audio ref={audioRef} playsInline preload="auto" className="global-audio" aria-hidden="true" />
      <Sidebar
        tracks={tracks}
        activeTrackId={activeTrack?.id}
        onSelectTrack={(track) => selectTrack(track, { shouldAutoPlay: true })}
        onRemoveTrack={handleRemoveTrack}
        onAddClick={() => setShowAddForm(true)}
      />

      <main className="main-content">
        <header className="hero">
          <p className="eyebrow">Home NAS Player</p>
          <h1>Your private playlist</h1>
          <p className="subtitle">
            Search your media catalog, save favorites, and stream through your local proxy.
          </p>
        </header>

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={runSearch}
          isSearching={isSearching}
        />

        <SearchResults
          query={lastQuery}
          results={results}
          isSearching={isSearching}
          error={searchError}
          activeTrackId={activeTrack?.streamId || activeTrack?.id}
          onPlay={handlePlaySearchResult}
          onAdd={handleAddSearchResult}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />

        {playlistMessage ? <p className="playlist-message">{playlistMessage}</p> : null}

        {showAddForm ? (
          <AddTrackForm
            onSubmit={handleAddTrack}
            onCancel={tracks.length > 0 ? () => setShowAddForm(false) : undefined}
          />
        ) : (
          <button type="button" className="show-form-btn" onClick={() => setShowAddForm(true)}>
            + Add another track
          </button>
        )}

        {/* הזרקנו פה בצורה מלאה את הפרופס התומכים בהורדה לתוך רשימת השירים */}
        <TrackList
          tracks={tracks}
          activeTrackId={activeTrack?.id}
          onSelectTrack={(track) => selectTrack(track, { shouldAutoPlay: true })}
          downloadTrack={downloadTrack}
          downloadingIds={downloadingIds}
        />
      </main>

      {activeTrack ? (
        <AudioPlayer
          key={activeTrack.streamId || activeTrack.id}
          audioRef={audioRef}
          currentTrack={activeTrack}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onNext={goToNext}
          onPrevious={goToPrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onTrackEnded={handleTrackEnded}
        />
      ) : null}
    </div>
  );
}