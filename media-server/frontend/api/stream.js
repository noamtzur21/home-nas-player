import { buildAudioProxyUrl, resolveFromPiped } from "../lib/resolveStream.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing stream id" });
  }

  try {
    const stream = await resolveFromPiped(id);
    return res.status(200).json(stream);
  } catch (pipedError) {
    console.warn("[stream] Piped unavailable, falling back to audio proxy:", pipedError.message);
    return res.status(200).json({
      url: buildAudioProxyUrl(id),
      source: "vercel-audio-proxy",
      pipedError: pipedError.message,
    });
  }
}
