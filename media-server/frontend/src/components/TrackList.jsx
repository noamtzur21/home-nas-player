import AddMp3Button from "./AddMp3Button.jsx";
import TrackRow from "./TrackRow.jsx";
import "./TrackList.css";

export default function TrackList({
  tracks,
  activeTrackId,
  onSelectTrack,
  onRemoveTrack,
  onRenameTrack,
  onAddTrack,
  isUploading,
  title = "Songs",
}) {
  return (
    <section className="track-panel">
      <div className="track-panel-header">
        <h2>{title}</h2>
        <div className="track-panel-header-actions">
          <span>{tracks.length} tracks</span>
          {onAddTrack ? <AddMp3Button onUpload={onAddTrack} disabled={isUploading} /> : null}
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="track-panel-empty">No songs yet. Tap + to add an MP3.</p>
      ) : (
        <div className="track-list">
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isActive={track.id === activeTrackId}
              onSelectTrack={onSelectTrack}
              onRemoveTrack={onRemoveTrack}
              onRenameTrack={onRenameTrack}
            />
          ))}
        </div>
      )}
    </section>
  );
}
