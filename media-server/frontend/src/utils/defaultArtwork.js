export const DEFAULT_OFFLINE_ARTWORK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="16" fill="#1a1a1a"/>
      <circle cx="60" cy="60" r="28" fill="#1db954" opacity="0.9"/>
      <path d="M48 44v36l32-18z" fill="#000"/>
    </svg>`,
  );
