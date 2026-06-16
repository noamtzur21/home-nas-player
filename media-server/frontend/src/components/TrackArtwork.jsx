import { useEffect, useState } from "react";
import { getArtworkUrl } from "../utils/offlineStorage.js";
import { DEFAULT_OFFLINE_ARTWORK } from "../utils/defaultArtwork.js";

export default function TrackArtwork({ track, className }) {
  const [src, setSrc] = useState(track.artwork || DEFAULT_OFFLINE_ARTWORK);

  useEffect(() => {
    let cancelled = false;

    getArtworkUrl(track.id, track.artwork || DEFAULT_OFFLINE_ARTWORK).then((url) => {
      if (!cancelled && url) setSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [track.id, track.artwork]);

  return <img src={src} alt="" className={className} />;
}
