const STORAGE_KEY = "nas-player-debug";
const MAX_LOGS = 80;

const logs = [];
const listeners = new Set();

function isEnabledFromUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

export function isDebugEnabled() {
  if (typeof window === "undefined") return false;
  return isEnabledFromUrl() || localStorage.getItem(STORAGE_KEY) === "1";
}

export function setDebugEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  notify();
}

export function toggleDebug() {
  const next = !isDebugEnabled();
  setDebugEnabled(next);
  debugLog("debug", next ? "Debug panel enabled" : "Debug panel disabled");
  return next;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeDebug(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDebugLogs() {
  return [...logs];
}

function postRemote(entry) {
  if (typeof fetch === "undefined") return;

  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
    keepalive: true,
  }).catch(() => {});
}

export function debugLog(level, message, data) {
  const entry = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    level,
    message,
    data: data ?? null,
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  logs.unshift(entry);
  if (logs.length > MAX_LOGS) logs.pop();

  const prefix = `[NAS ${level.toUpperCase()}]`;
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }

  if (level === "error" || isDebugEnabled()) {
    postRemote(entry);
  }

  notify();
}

export function getAudioErrorDetails(audio) {
  if (!audio?.error) return "unknown audio error";

  const codes = {
    1: "MEDIA_ERR_ABORTED",
    2: "MEDIA_ERR_NETWORK",
    3: "MEDIA_ERR_DECODE",
    4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
  };

  return {
    code: audio.error.code,
    label: codes[audio.error.code] || "UNKNOWN",
    message: audio.error.message || "",
    currentSrc: audio.currentSrc || audio.src || "",
    readyState: audio.readyState,
    networkState: audio.networkState,
  };
}
