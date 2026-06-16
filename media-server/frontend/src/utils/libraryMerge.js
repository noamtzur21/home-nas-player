function trackIds(tracks = []) {
  return new Set(tracks.map((track) => track.id));
}

function mergeTrackLists(remoteTracks = [], localTracks = []) {
  const remoteIds = trackIds(remoteTracks);
  const localOnly = localTracks.filter((track) => !remoteIds.has(track.id));
  if (!localOnly.length) return remoteTracks;

  const merged = [...localOnly, ...remoteTracks];
  const seen = new Set();
  return merged.filter((track) => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
}

function mergePlaylist(remotePlaylist, localPlaylist) {
  if (!localPlaylist) return remotePlaylist;

  return {
    ...remotePlaylist,
    name: localPlaylist.name || remotePlaylist.name,
    tracks: mergeTrackLists(remotePlaylist.tracks, localPlaylist.tracks),
  };
}

export function mergeLibraries(remote, local) {
  if (!local?.playlists?.length) return remote || local;
  if (!remote?.playlists?.length) return local;

  const localById = new Map(local.playlists.map((playlist) => [playlist.id, playlist]));
  const remoteIds = new Set(remote.playlists.map((playlist) => playlist.id));

  const playlists = remote.playlists.map((remotePlaylist) =>
    mergePlaylist(remotePlaylist, localById.get(remotePlaylist.id)),
  );

  const localOnlyPlaylists = local.playlists.filter((playlist) => !remoteIds.has(playlist.id));

  return {
    playlists: [...localOnlyPlaylists, ...playlists],
    activePlaylistId: local.activePlaylistId || remote.activePlaylistId,
  };
}
