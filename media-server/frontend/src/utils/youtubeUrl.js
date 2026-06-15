export function getYoutubeUrl(result) {
  return result.url || `https://www.youtube.com/watch?v=${result.id}`;
}

export async function copyYoutubeUrl(result) {
  const url = getYoutubeUrl(result);
  await navigator.clipboard.writeText(url);
  return url;
}
