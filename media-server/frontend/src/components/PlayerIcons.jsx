export function IconPrevious() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

export function IconNext() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 18h2V6h-2v12zm-11-6l8.5-6v12L5 12z" />
    </svg>
  );
}

export function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

export function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

export function IconSpinner() {
  return (
    <svg className="player-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDots() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function IconMinusCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlusCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export function IconShuffle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d="M3 6h3.5c1.6 0 3 .9 3.8 2.3M3 18h3.5c1.6 0 3-.9 3.8-2.3M14.7 8.3c.8-1.4 2.2-2.3 3.8-2.3H21M14.7 15.7c.8 1.4 2.2 2.3 3.8 2.3H21"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18.5 3.5L21 6l-2.5 2.5M18.5 20.5L21 18l-2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRepeat({ mode = "off" }) {
  return (
    <span className="icon-repeat-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 7h11a3 3 0 0 1 3 3v2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 4L4.5 7 7 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 17H8a3 3 0 0 1-3-3v-2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 20l2.5-3-2.5-3" strokeLinecap="round" strokeLinejoin="round" />
        {mode === "one" ? <text x="12" y="14" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none">1</text> : null}
      </svg>
    </span>
  );
}

export function IconDevices() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2.5" y="5" width="13" height="9" rx="1.5" />
      <path d="M6 19h5M8.5 14v5" strokeLinecap="round" />
      <path d="M17.5 9a4 4 0 0 1 0 6M19.8 7a7 7 0 0 1 0 10" strokeLinecap="round" />
    </svg>
  );
}

export function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d="M12 3v12M8 7l4-4 4 4M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconQueue() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h13M3 12h13M3 18h7" strokeLinecap="round" />
      <path d="M18 9v10M18 9l-3 3M18 9l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
