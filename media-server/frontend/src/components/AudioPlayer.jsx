import React, { useState, useEffect, useRef } from "react";

export default function AudioPlayer({ currentTrack, isPlaying, setIsPlaying, onNext, onPrevious, hasNext, hasPrevious, onTrackEnded }) {
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audioRef = useRef(null);

  // סנכרון פליי/פאוס מול אלמנט האודיו
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // סנכרון ווליום
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // --- חיבור קריטי ל-Apple CarPlay / iOS Media Session ---
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      // עדכון ה-UI על המסך של הרכב (CarPlay)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: "Home Media Server",
        artwork: [
          { src: currentTrack.artwork || "https://placehold.co/512x512/1db954/ffffff?text=Music", sizes: "512x512", type: "image/png" }
        ]
      });

      // האזנה לכפתורים שעל ההגה של האוטו או מסך ה-CarPlay
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (hasPrevious) onPrevious();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (hasNext) onNext();
      });
    }
  }, [currentTrack, isPlaying, onNext, onPrevious, hasNext, hasPrevious, setIsPlaying]);

  if (!currentTrack) return null;

  const streamUrl = currentTrack.streamId
    ? `http://localhost:3001/stream?id=${currentTrack.streamId}`
    : currentTrack.sourceUrl;

  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeekChange = (e) => {
    setIsSeeking(true);
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e) => {
    const nextTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
    setIsSeeking(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '90px',
      background: '#181818',
      borderTop: '1px solid #282828',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 9999,
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <audio
        ref={audioRef}
        src={streamUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onTrackEnded}
        preload="auto"
      />
      
      {/* צד שמאל: מידע */}
      <div style={{ display: 'flex', alignItems: 'center', width: '30%' }}>
        <img 
          src={currentTrack.artwork || "https://placehold.co/56"} 
          alt={currentTrack.title} 
          style={{ width: '56px', height: '56px', borderRadius: '4px', marginRight: '14px', objectFit: 'cover', flexShrink: 0 }} 
        />
        <div style={{ overflow: 'hidden' }}>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{currentTrack.title}</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{currentTrack.artist}</p>
        </div>
      </div>

      {/* מרכז: כפתורים ובר זמן */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <button onClick={onPrevious} disabled={!hasPrevious} style={{ background: 'none', border: 'none', color: hasPrevious ? '#fff' : '#555', cursor: hasPrevious ? 'pointer' : 'default', fontSize: '16px' }}>⏮</button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ background: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#000' }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={onNext} disabled={!hasNext} style={{ background: 'none', border: 'none', color: hasNext ? '#fff' : '#555', cursor: hasNext ? 'pointer' : 'default', fontSize: '16px' }}>⏭</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#b3b3b3', minWidth: '35px', textAlign: 'right' }}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={currentTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            style={{ flexGrow: 1, accentColor: '#1db954', height: '4px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '11px', color: '#b3b3b3', minWidth: '35px' }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* צד ימין: ווליום */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '30%', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '14px', color: '#b3b3b3' }}>🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ width: '100px', accentColor: '#1db954', height: '4px', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}