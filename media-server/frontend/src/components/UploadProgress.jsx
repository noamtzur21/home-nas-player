import "./UploadProgress.css";

export default function UploadProgress({ progress }) {
  if (!progress) return null;

  return (
    <div className="upload-progress-overlay" role="status" aria-live="polite">
      <div className="upload-progress-card">
        <p className="upload-progress-label">{progress.label}</p>
        <div className="upload-progress-bar">
          <div className="upload-progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="upload-progress-percent">{progress.percent}%</span>
      </div>
    </div>
  );
}
