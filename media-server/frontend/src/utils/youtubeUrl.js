const DOWNLOADER_URL = "https://oneforalldownloader.com/";

export function getYoutubeUrl(result) {
  return result.url || `https://www.youtube.com/watch?v=${result.id}`;
}

export async function copyYoutubeUrl(result) {
  const url = getYoutubeUrl(result);
  await navigator.clipboard.writeText(url);
  return url;
}

export async function openDownloaderForVideo(result) {
  const youtubeUrl = getYoutubeUrl(result);

  try {
    await navigator.clipboard.writeText(youtubeUrl);
  } catch {
    /* clipboard optional */
  }

  const link = document.createElement("a");
  link.href = DOWNLOADER_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();

  return youtubeUrl;
}
