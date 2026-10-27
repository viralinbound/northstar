/**
 * Shared, mutable flight state. ScrollTrigger writes `target`; the overlay
 * loop eases `current` toward it every frame and the 3D scene reads it, so
 * scrolling either way plays the sequence forward or backward from wherever it is.
 */
export const flight = {
  target: 0,
  current: 0,
  velocity: 0,
  /** drone ground speed in world units (m) per second */
  speed: 0,
  altitude: 0,
  heading: 0,
}

export type Chapter = {
  id: string
  label: string
  mode: string
  start: number
  end: number
}

export const CHAPTERS: Chapter[] = [
  { id: 'hero', label: 'Ready', mode: 'PAD', start: 0, end: 0.1 },
  { id: 'takeoff', label: 'Lift-off', mode: 'TAKEOFF', start: 0.1, end: 0.22 },
  { id: 'transit', label: 'Transit', mode: 'AUTO', start: 0.22, end: 0.36 },
  { id: 'survey', label: 'Survey', mode: 'SURVEY', start: 0.36, end: 0.54 },
  { id: 'inspect', label: 'Inspect', mode: 'INSPECT', start: 0.54, end: 0.7 },
  { id: 'reconstruct', label: 'Reconstruct', mode: 'RECON', start: 0.7, end: 0.84 },
  { id: 'handoff', label: 'Handoff', mode: 'HANDOFF', start: 0.84, end: 1 },
]

export function chapterAt(p: number): number {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (p >= CHAPTERS[i].start) return i
  return 0
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 0 → 1 → 0 window across [a, d] with plateaus between b and c. */
export const windowed = (a: number, b: number, c: number, d: number, x: number) =>
  smoothstep(a, b, x) * (1 - smoothstep(c, d, x))
