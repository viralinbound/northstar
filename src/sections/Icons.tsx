const common = {
  width: 28,
  height: 28,
  viewBox: '0 0 28 28',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function CapIcon({ id }: { id: string }) {
  switch (id) {
    case 'mapping':
      return (
        <svg {...common} className="cap-icon">
          <path d="M3 7l7-3 8 3 7-3v17l-7 3-8-3-7 3z" />
          <path d="M10 4v17M18 7v17" />
        </svg>
      )
    case 'surveying':
      return (
        <svg {...common} className="cap-icon">
          <path d="M3 21c4-6 7-8 11-8s6 3 11 1" />
          <path d="M3 16c4-5 7-6 11-6s6 2 11 0" opacity=".55" />
          <path d="M3 11c4-4 7-4 11-4s6 1 11-1" opacity=".3" />
        </svg>
      )
    case 'inspection':
      return (
        <svg {...common} className="cap-icon">
          <circle cx="12" cy="12" r="6.5" />
          <path d="M17 17l7 7M9 12h6M12 9v6" />
        </svg>
      )
    case 'progress':
      return (
        <svg {...common} className="cap-icon">
          <path d="M4 24V14h5v10M11.5 24V9h5v15M19 24V4h5v20" />
          <path d="M2 24h24" />
        </svg>
      )
    case 'reconstruction':
      return (
        <svg {...common} className="cap-icon">
          <path d="M14 3l10 5.5v11L14 25 4 19.5v-11z" />
          <path d="M14 14l10-5.5M14 14L4 8.5M14 14v11" />
        </svg>
      )
    default:
      return (
        <svg {...common} className="cap-icon">
          <circle cx="14" cy="14" r="3" />
          <circle cx="5" cy="6" r="1.6" />
          <circle cx="23" cy="6" r="1.6" />
          <circle cx="5" cy="22" r="1.6" />
          <circle cx="23" cy="22" r="1.6" />
          <path d="M6.3 7.2l5.3 4.8M21.7 7.2l-5.3 4.8M6.3 20.8l5.3-4.8M21.7 20.8l-5.3-4.8" />
        </svg>
      )
  }
}

/** The Northstar mark: a four-point star with a compass ring. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M16 2.5l2.6 10.9L29.5 16l-10.9 2.6L16 29.5l-2.6-10.9L2.5 16l10.9-2.6z" fill="var(--gold)" />
    </svg>
  )
}

/** Static line illustration used when 3D is unavailable or motion is reduced. */
export function StaticDroneArt() {
  return (
    <svg viewBox="0 0 640 360" className="static-art" role="img" aria-label="Survey drone above a mapped terrain grid">
      <defs>
        <linearGradient id="sa-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--art-sky-1)' }} />
          <stop offset=".7" style={{ stopColor: 'var(--art-sky-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--art-sky-3)', stopOpacity: 0.55 }} />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#sa-sky)" />
      <g stroke="var(--cyan)" strokeOpacity=".45" fill="none">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`h${i}`} d={`M${-40 - i * 30} ${240 + i * 15}L${680 + i * 30} ${240 + i * 15}`} />
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <path key={`v${i}`} d={`M${320 + (i - 7) * 26} 240L${320 + (i - 7) * 120} 380`} />
        ))}
      </g>
      <path d="M260 250L320 120L380 250Z" fill="#62e6f0" fillOpacity=".07" stroke="#62e6f0" strokeOpacity=".5" />
      <g transform="translate(320 112)">
        <rect x="-22" y="-7" width="44" height="14" rx="5" fill="#e9ecf1" />
        <path d="M-22 -2h-34M22 -2h34" stroke="#e9ecf1" strokeWidth="4" strokeLinecap="round" />
        <path d="M-74 -9h36M38 -9h36" stroke="#9aa6b6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="11" r="5" fill="#1b2029" stroke="#62e6f0" />
      </g>
      <path d="M548 54l3 11 11 3-11 3-3 11-3-11-11-3 11-3z" fill="#f2c26b" />
    </svg>
  )
}

export function StaticRobotArt() {
  return (
    <svg viewBox="0 0 480 360" className="static-art" role="img" aria-label="Northstar four-legged ground unit">
      <ellipse cx="240" cy="300" rx="150" ry="16" fill="#000" opacity=".35" />
      <g stroke="#2a2f38" strokeWidth="16" strokeLinecap="round" fill="none">
        <path d="M168 196l-22 52 24 50" />
        <path d="M312 196l-22 52 24 50" />
      </g>
      <g stroke="#d7dbe2" strokeWidth="11" strokeLinecap="round" fill="none">
        <path d="M150 200l-18 50 22 48" />
        <path d="M294 200l-18 50 22 48" />
      </g>
      <rect x="120" y="150" width="240" height="60" rx="16" fill="#2a2f38" />
      <rect x="140" y="140" width="170" height="16" rx="6" fill="#d7dbe2" />
      <rect x="120" y="178" width="240" height="4" fill="#f2c26b" />
      <rect x="350" y="148" width="54" height="46" rx="12" fill="#d7dbe2" />
      <rect x="388" y="162" width="18" height="12" rx="3" fill="#f2c26b" />
      <rect x="360" y="128" width="30" height="18" rx="5" fill="#14181f" />
    </svg>
  )
}
