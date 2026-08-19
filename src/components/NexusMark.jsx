export function NexusMark({ compact = false }) {
  return <span className={`nexus-mark ${compact ? 'compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 48 48" role="presentation">
      <defs>
        <linearGradient id="nexus-gradient" x1="5" y1="5" x2="43" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#72C7FF" />
          <stop offset="0.52" stopColor="#2EA9FF" />
          <stop offset="1" stopColor="#27D6C5" />
        </linearGradient>
      </defs>
      <path d="M11 35V13l26 22V13" fill="none" stroke="url(#nexus-gradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="13" r="4" fill="#72C7FF" />
      <circle cx="11" cy="35" r="4" fill="#2EA9FF" />
      <circle cx="37" cy="13" r="4" fill="#27D6C5" />
      <circle cx="37" cy="35" r="4" fill="#39B8FF" />
    </svg>
  </span>
}
