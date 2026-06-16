export function fetchWithTimeout(url, ms = 12000, init = {}) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}
