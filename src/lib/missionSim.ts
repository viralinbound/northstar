import { SITE, planSurvey, type Pt } from './survey'

/**
 * Deterministic demo mission for the live dashboard. Everything is derived from the same
 * survey maths as the planner, then played back faster than real time.
 */
export const ALT = 70
export const OVERLAP = 0.7
export const PLAN = planSurvey(SITE, ALT, OVERLAP)
export const HOME: Pt = [PLAN.path[0][0] - 16, PLAN.path[0][1] - 20]

const PTS: Pt[] = [HOME, ...PLAN.path, HOME]
const SEG = PTS.slice(1).map((p, i) => {
  const a = PTS[i]
  return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) }
})
const CUM: number[] = []
SEG.reduce((acc, s, i) => ((CUM[i] = acc), acc + s.len), 0)
export const ROUTE_LEN = SEG.reduce((a, s) => a + s.len, 0)
/** survey lines are the odd segments between the outbound and return legs */
const isLine = (i: number) => i % 2 === 1 && i < SEG.length - 1
const LINE_LEN = SEG.reduce((a, s, i) => a + (isLine(i) ? s.len : 0), 0)
const TRIGGER = PLAN.along * (1 - OVERLAP)

export const T_TAKEOFF = 4
export const T_FLY = 52
export const T_LAND = 4
export const T_HOLD = 3
export const T_TOTAL = T_TAKEOFF + T_FLY + T_LAND + T_HOLD
/** how much faster than a real flight this plays (real cruise is 10 m/s) */
export const REPLAY_FACTOR = Math.round(ROUTE_LEN / 10 / T_FLY)

export type Phase = 'Pre-flight' | 'Take-off' | 'Transit' | 'Survey' | 'Return home' | 'Landing' | 'Landed'

export type Frame = {
  t: number
  phase: Phase
  pos: Pt
  heading: number
  alt: number
  speed: number
  battery: number
  photos: number
  coverage: number
  travelled: number
  line: number
  lines: number
}

/** Survey-line distance flown by route distance `d`, and how many lines have been started. */
function lineProgress(d: number) {
  let sum = 0
  let started = 0
  for (let i = 0; i < SEG.length; i++) {
    if (CUM[i] >= d) break
    if (isLine(i)) {
      sum += Math.min(SEG[i].len, d - CUM[i])
      started++
    }
  }
  return { sum, started }
}

export function frameAt(t: number): Frame {
  const flyStart = T_TAKEOFF
  const flyEnd = T_TAKEOFF + T_FLY
  let d = 0
  let alt = ALT
  let phase: Phase = 'Survey'
  if (t < T_TAKEOFF) {
    const k = t / T_TAKEOFF
    alt = ALT * k * k * (3 - 2 * k)
    phase = t < 0.6 ? 'Pre-flight' : 'Take-off'
  } else if (t < flyEnd) {
    d = ((t - flyStart) / T_FLY) * ROUTE_LEN
  } else if (t < flyEnd + T_LAND) {
    d = ROUTE_LEN
    const k = (t - flyEnd) / T_LAND
    alt = ALT * (1 - k * k * (3 - 2 * k))
    phase = 'Landing'
  } else {
    d = ROUTE_LEN
    alt = 0
    phase = 'Landed'
  }

  let i = 0
  while (i < SEG.length - 1 && CUM[i + 1] <= d) i++
  const s = SEG[i]
  const k = s.len ? Math.min(1, Math.max(0, (d - CUM[i]) / s.len)) : 0
  const pos: Pt = [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k]
  const heading = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0])
  if (phase === 'Survey' && t >= flyStart) {
    if (i === 0) phase = 'Transit'
    else if (i === SEG.length - 1) phase = 'Return home'
  }
  const flying = phase === 'Survey' || phase === 'Transit' || phase === 'Return home'
  const wobble = Math.sin(t * 2.3) * 0.25 + Math.sin(t * 5.1) * 0.12
  const { sum: ld, started } = lineProgress(d)
  return {
    t,
    phase,
    pos,
    heading,
    alt: alt + (flying ? Math.sin(t * 1.7) * 0.4 : 0),
    speed: flying ? (isLine(i) ? 10 : 12) + wobble : phase === 'Take-off' || phase === 'Landing' ? 2.5 + wobble : 0,
    battery: 100 - 34 * Math.min(1, t / (flyEnd + T_LAND)),
    // one photo at the start of each line, then one every trigger distance
    photos: Math.floor(ld / TRIGGER) + started,
    coverage: (ld / LINE_LEN) * 100,
    travelled: d,
    line: Math.min(PLAN.lines.length, Math.max(0, Math.ceil(i / 2))),
    lines: PLAN.lines.length,
  }
}

/** The x-span of survey line `i` flown between route distances d0 and d1 (for painting coverage). */
export function paintedSpans(d0: number, d1: number) {
  const out: { x0: number; x1: number; y: number }[] = []
  for (let i = 0; i < SEG.length; i++) {
    if (!isLine(i)) continue
    const s0 = CUM[i]
    const s1 = CUM[i] + SEG[i].len
    const a = Math.max(d0, s0)
    const b = Math.min(d1, s1)
    if (b <= a) continue
    const s = SEG[i]
    const xa = s.a[0] + ((s.b[0] - s.a[0]) * (a - s0)) / s.len
    const xb = s.a[0] + ((s.b[0] - s.a[0]) * (b - s0)) / s.len
    out.push({ x0: Math.min(xa, xb), x1: Math.max(xa, xb), y: s.a[1] })
  }
  return out
}

export type Poi = { id: string; at: Pt; title: string; kind: string; level: 'Check' | 'Watch' | 'Note' }

/** Things the demo "finds". Positions are inside the demo site boundary. */
export const POIS: Poi[] = [
  { id: 'water', at: [120, 95], title: 'Standing water after rain', kind: 'Drainage', level: 'Watch' },
  { id: 'stock', at: [250, 110], title: 'Stockpile grew since last week', kind: 'Volumes', level: 'Note' },
  { id: 'drain', at: [345, 140], title: 'Drain cover looks blocked', kind: 'Drainage', level: 'Check' },
  { id: 'roof', at: [300, 200], title: 'Roof panel missing on block C', kind: 'Roof', level: 'Check' },
  { id: 'slab', at: [170, 235], title: 'Crack along slab edge', kind: 'Concrete', level: 'Watch' },
]

/** A POI is spotted once the drone has flown over it on a survey line. */
export function spotted(poi: Poi, f: Frame, prevTravelled: number) {
  if (f.phase !== 'Survey') return false
  const halfSwath = PLAN.across / 2
  return paintedSpans(prevTravelled, f.travelled).some(
    (s) => Math.abs(s.y - poi.at[1]) < halfSwath && poi.at[0] >= s.x0 - 4 && poi.at[0] <= s.x1 + 4,
  )
}

export const fmtClock = (s: number) => {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** Route points flown so far (for drawing the solid "done" part of the path). */
export function routeUpTo(d: number): Pt[] {
  const out: Pt[] = [PTS[0]]
  for (let i = 0; i < SEG.length; i++) {
    const s = SEG[i]
    if (CUM[i] + s.len <= d) {
      out.push(s.b)
      continue
    }
    const k = Math.max(0, (d - CUM[i]) / s.len)
    out.push([s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k])
    break
  }
  return out
}

export const ROUTE: Pt[] = PTS
