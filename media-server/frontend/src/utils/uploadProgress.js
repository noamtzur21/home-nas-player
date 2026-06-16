export function createSmoothProgress(onProgress) {
  let value = 0;

  const emit = (next, label) => {
    value = Math.min(100, Math.max(0, next));
    onProgress({ percent: Math.round(value), label });
  };

  return {
    set: emit,
    get value() {
      return value;
    },
  };
}

export async function saveTrackBlobWithProgress(trackId, file, saveTrackBlob, onChunkProgress) {
  const totalBytes = file.size || 0;

  if (!totalBytes) {
    await saveTrackBlob(trackId, file);
    onChunkProgress(1);
    return file;
  }

  const chunkSize = 512 * 1024;

  if (totalBytes <= chunkSize) {
    onChunkProgress(0.08);
    await saveTrackBlob(trackId, file);
    onChunkProgress(1);
    return file;
  }

  const chunks = [];
  let offset = 0;

  while (offset < totalBytes) {
    const end = Math.min(offset + chunkSize, totalBytes);
    chunks.push(await file.slice(offset, end).arrayBuffer());
    offset = end;
    onChunkProgress((offset / totalBytes) * 0.75);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  onChunkProgress(0.78);
  const blob = new Blob(chunks, { type: file.type || "audio/mpeg" });
  await saveTrackBlob(trackId, blob);
  onChunkProgress(1);
  return blob;
}

export async function readResponseWithProgress(response, onChunkProgress) {
  const totalBytes = Number(response.headers.get("content-length")) || 0;
  const reader = response.body?.getReader();

  if (!reader) {
    const blob = await response.blob();
    onChunkProgress(1);
    return blob;
  }

  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (totalBytes > 0) {
      onChunkProgress(Math.min(1, loaded / totalBytes));
    } else {
      onChunkProgress(Math.min(0.99, loaded / (loaded + chunkSizeEstimate(loaded))));
    }
  }

  onChunkProgress(1);
  const mimeType = response.headers.get("content-type") || "audio/mp4";
  return new Blob(chunks, { type: mimeType });
}

function chunkSizeEstimate(loaded) {
  return Math.max(256 * 1024, loaded * 0.05);
}
