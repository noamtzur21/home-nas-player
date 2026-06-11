import { resolvePlayableUrl } from "./stream";
import { debugLog, getAudioErrorDetails } from "./debugLog";

function urlsMatch(left, right) {
  if (!left || !right) return false;

  try {
    return new URL(left, window.location.href).href === new URL(right, window.location.href).href;
  } catch {
    return left === right;
  }
}

function waitForCanPlay(audio, timeoutMs = 90000) {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Audio load timed out (20s)"));
    }, timeoutMs);

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Audio element error: ${JSON.stringify(getAudioErrorDetails(audio))}`));
    };
    const cleanup = () => {
      clearTimeout(timer);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("canplay", onReady);
    audio.addEventListener("error", onError);
  });
}

export async function playAudioElement(audio, url) {
  if (!audio || !url) {
    throw new Error("Missing audio element or stream url");
  }

  debugLog("info", "playAudioElement start", { inputUrl: url.slice(0, 100) });

  const playableUrl = await resolvePlayableUrl(url);
  const alreadyRequested = urlsMatch(audio.dataset.requestedSrc, playableUrl);

  debugLog("info", "Setting audio src", {
    alreadyRequested,
    playableUrlPreview: playableUrl.slice(0, 100),
    readyState: audio.readyState,
  });

  if (!alreadyRequested) {
    audio.dataset.requestedSrc = playableUrl;
    audio.src = playableUrl;
    audio.load();
  } else if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
    audio.load();
  }

  await waitForCanPlay(audio);

  try {
    await audio.play();
    debugLog("info", "audio.play() succeeded");
  } catch (error) {
    debugLog("error", "audio.play() rejected", {
      name: error.name,
      message: error.message,
    });
    throw error;
  }
}

export { urlsMatch, waitForCanPlay };
