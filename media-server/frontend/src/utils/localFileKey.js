export function buildLocalFileKey(file) {
  if (!file) return "";
  return `${file.name.toLowerCase()}|${file.size}|${file.lastModified}`;
}

export function findDuplicateLocalTrack(playlists, file, fileKey = buildLocalFileKey(file)) {
  if (!fileKey) return null;

  for (const playlist of playlists || []) {
    for (const track of playlist.tracks || []) {
      if (!track.isLocal) continue;
      if (track.localFileKey === fileKey) return track;
      if (!track.localFileKey && track.fileSize === file.size) {
        const normalizedName = file.name.replace(/\.[^.]+$/i, "").toLowerCase();
        const normalizedTitle = (track.title || "").toLowerCase();
        if (normalizedName.includes(normalizedTitle) || normalizedTitle.includes(normalizedName.slice(0, 20))) {
          return track;
        }
      }
    }
  }

  return null;
}
