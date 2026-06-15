import { Readable } from "node:stream";
import { resolveFromCobalt, resolveFromPiped, resolveFromYoutubei } from "../lib/resolveStream.js";

const IOS_USER_AGENT =
  "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)";

function safeFilename(id) {
  return `${String(id).replace(/[^\w-]/g, "") || "track"}.mp3`;
}

async function getUpstreamUrl(videoId) {
  try {
    return (await resolveFromCobalt(videoId)).url;
  } catch (cobaltError) {
    console.warn("[download] Cobalt failed:", cobaltError.message);
    try {
      return (await resolveFromPiped(videoId)).url;
    } catch (pipedError) {
      console.warn("[download] Piped failed:", pipedError.message);
      return (await resolveFromYoutubei(videoId)).url;
    }
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing video id" });
  }

  try {
    const upstreamUrl = await getUpstreamUrl(id);
    const upstream = await fetch(upstreamUrl, {
      headers: { "User-Agent": IOS_USER_AGENT },
    });

    if (!upstream.ok) {
      return res.status(502).json({
        error: "Failed to fetch audio from YouTube",
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get("content-type") || "audio/mpeg";

    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(id)}"`);
    res.setHeader("Content-Type", contentType);

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    if (!upstream.body) {
      return res.end();
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error("[download]", error.message);
    return res.status(500).json({ error: "Download failed", detail: error.message });
  }
}
