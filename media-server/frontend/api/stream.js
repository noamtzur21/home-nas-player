const BACKEND_URL = process.env.STREAM_BACKEND_URL?.replace(/\/$/, "");

async function resolveViaBackend(id) {
  if (!BACKEND_URL) return null;

  try {
    const response = await fetch(`${BACKEND_URL}/resolve?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(55000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return { url: data.url, source: data.source || "backend-resolve" };
      }
    }
  } catch (error) {
    console.error("[stream] backend resolve failed:", error.message);
  }

  return {
    url: `${BACKEND_URL}/stream?id=${encodeURIComponent(id)}`,
    source: "backend-stream",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Range");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id, url: sourceUrl } = req.query;

  if (sourceUrl) {
    return res.status(200).json({ url: sourceUrl, source: "direct" });
  }

  if (!id) {
    return res.status(400).json({ error: "Missing stream id" });
  }

  try {
    const backendResult = await resolveViaBackend(id);
    if (backendResult?.url) {
      return res.status(200).json(backendResult);
    }

    return res.status(502).json({
      error: "Stream backend not configured",
      hint: "Set STREAM_BACKEND_URL in Vercel to https://media-server-backend-lwi0.onrender.com",
    });
  } catch (error) {
    console.error("Stream error:", error.message);
    return res.status(500).json({ error: "Failed to resolve audio stream", detail: error.message });
  }
}
