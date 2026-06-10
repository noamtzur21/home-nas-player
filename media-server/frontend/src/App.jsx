import { useCallback, useMemo, useState } from "react";
import AddTrackForm from "./components/AddTrackForm.jsx";
import AudioPlayer from "./components/AudioPlayer.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SearchResults from "./components/SearchResults.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TrackList from "./components/TrackList.jsx";
import { usePlaylist } from "./hooks/usePlaylist.js";
import { useSearch } from "./hooks/useSearch.js";
import { searchResultToTrack } from "./utils/stream.js";
import "./App.css";

export default function App() {
  const { tracks, addTrack, removeTrack } = usePlaylist();
  
  // חילצנו פה את המשתנים החדשים שמובילים את פונקציונליות ה-Show More
  const {
    query,
    setQuery,
    results,
    isSearching,
    error: searchError,
    lastQuery,
    hasMore,    // משתנה בוליאני חדש מההוק
    runSearch,
    loadMore,   // פונקציית הטעינה החדשה מההוק
  } = useSearch();

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

  const selectTrack = useCallback((track, { shouldAutoPlay = false } = {}) => {
    setActiveTrack(track);
    setIsPlaying(shouldAutoPlay);
  }, []);

  const handleAddTrack = (values) => {
    const result = addTrack(values);
    if (result.ok) {
      setPlaylistMessage("");
      selectTrack(result.track, { shouldAutoPlay: true });
    }
    return result;
  };

  const handleRemoveTrack = (id) => {
    removeTrack(id);
    if (activeTrack?.id === id) {
      setActiveTrack(null);
      setIsPlaying(false);
    }
  };

  const handlePlaySearchResult = useCallback(
    (result) => {
      selectTrack(searchResultToTrack(result), { shouldAutoPlay: true });
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

  const goToPrevious = useCallback(() => {
    if (!hasPrevious) return;
    selectTrack(tracks[activeIndex - 1], { shouldAutoPlay: true });
  }, [activeIndex, hasPrevious, selectTrack, tracks]);

  const goToNext = useCallback(() => {
    if (!hasNext) return;
    selectTrack(tracks[activeIndex + 1], { shouldAutoPlay: true });
  }, [activeIndex, hasNext, selectTrack, tracks]);

  const handleTrackEnded = useCallback(() => {
    if (hasNext) {
      goToNext();
    } else {
      setIsPlaying(false);
    }
  }, [goToNext, hasNext]);

  return (
    <div className="app-shell" style={{ paddingBottom: activeTrack ? '110px' : '0' }}>
      <Sidebar
        tracks={tracks}
        activeTrackId={activeTrack?.id}
        onSelectTrack={(track) => selectTrack(track)}
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

        {/* העברנו פה בצורה נקייה את הפרופס התומכים לתוך רכיב התוצאות המקורי */}
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

        <TrackList
          tracks={tracks}
          activeTrackId={activeTrack?.id}
          onSelectTrack={(track) => selectTrack(track)}
        />
      </main>

      {activeTrack ? (
        <AudioPlayer
          key={activeTrack.streamId || activeTrack.id}
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