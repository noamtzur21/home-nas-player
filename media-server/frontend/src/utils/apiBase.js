import { isNativeShell } from "./nativeShell";

const DEFAULT_REMOTE_API = "https://frontend-jade-nu-dej3pukqqd.vercel.app";

export function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (isNativeShell()) return DEFAULT_REMOTE_API;
  return "";
}

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalized}`;
}

export function searchApiUrl(query) {
  if (import.meta.env.DEV && !isNativeShell()) {
    return `/search?${new URLSearchParams({ q: query })}`;
  }
  return apiUrl(`/api/search?${new URLSearchParams({ q: query })}`);
}
