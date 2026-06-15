import { Readable } from "node:stream";
import { resolveFromYoutubei } from "../lib/resolveStream.js";

const IOS_USER_AGENT =
  "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing stream id" });
  }

  try {
    const { url: upstreamUrl } = await resolveFromYoutubei(id);
    const headers = { "User-Agent": IOS_USER_AGENT };
    if (req.headers.range) headers.Range = req.headers.range;

    const upstream = await fetch(upstreamUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers,
    });

    res.status(upstream.status);

    for (const name of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }

    if (!upstream.body || req.method === "HEAD") {
      return res.end();
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error("[audio proxy]", error.message);
    return res.status(500).json({ error: "Failed to proxy audio", detail: error.message });
  }
}
