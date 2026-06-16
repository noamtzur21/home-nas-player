import { useCallback, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function SeekSlider({ currentTime, duration, onSeek, onSeekPreview, className = "" }) {
  const trackRef = useRef(null);
  const seekingRef = useRef(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const clientXToTime = useCallback(
    (clientX) => {
      const el = trackRef.current;
      if (!el || !Number.isFinite(duration) || duration <= 0) return 0;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return 0;

      const ratio = (clientX - rect.left) / rect.width;
      return clamp(ratio * duration, 0, duration);
    },
    [duration],
  );

  const beginSeek = useCallback(
    (clientX, pointerId, target) => {
      if (duration <= 0) return;

      seekingRef.current = true;
      setIsSeeking(true);
      const time = clientXToTime(clientX);
      setSeekTime(time);
      onSeekPreview?.(time);

      if (typeof pointerId === "number") {
        try {
          target.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [clientXToTime, duration, onSeekPreview],
  );

  const moveSeek = useCallback(
    (clientX) => {
      if (!seekingRef.current) return;
      const time = clientXToTime(clientX);
      setSeekTime(time);
      onSeekPreview?.(time);
    },
    [clientXToTime, onSeekPreview],
  );

  const finishSeek = useCallback(
    (clientX, pointerId, target) => {
      if (!seekingRef.current) return;

      const time = clientXToTime(clientX);
      seekingRef.current = false;
      setIsSeeking(false);
      onSeekPreview?.(null);
      onSeek(time);

      if (typeof pointerId === "number") {
        try {
          target.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [clientXToTime, onSeek, onSeekPreview],
  );

  const handlePointerDown = (event) => {
    event.preventDefault();
    beginSeek(event.clientX, event.pointerId, event.currentTarget);
  };

  const handlePointerMove = (event) => {
    if (!seekingRef.current) return;
    event.preventDefault();
    moveSeek(event.clientX);
  };

  const handlePointerUp = (event) => {
    finishSeek(event.clientX, event.pointerId, event.currentTarget);
  };

  const displayTime = isSeeking ? seekTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div
      ref={trackRef}
      className={`seek-slider${className ? ` ${className}` : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={displayTime}
      aria-valuetext={`${Math.floor(displayTime)} seconds`}
    >
      <div className="seek-slider-track" aria-hidden="true">
        <div className="seek-slider-fill" style={{ width: `${progress}%` }} />
        <div className="seek-slider-thumb" style={{ left: `${progress}%` }} />
      </div>
    </div>
  );
}
