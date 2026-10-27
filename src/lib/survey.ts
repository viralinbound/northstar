/**
 * Lawnmower survey planning over a polygon, using standard photogrammetry
 * relations. Camera assumption: 1-inch sensor (13.2 × 8.8 mm), 8.8 mm lens,
 * 5472 px wide — a common mapping-drone setup.
 */
export const CAMERA = { sensorW: 13.2, sensorH: 8.8, focal: 8.8, imageW: 5472 }
export const CRUISE_MS = 10 // ground speed, m/s
export const TURN_S = 6 // time lost per line turn, s
export const BATTERY_MIN = 25 // usable flight time per battery, min

export type Pt = [number, number]

/** Demo site boundary in metres (x right, y down) inside a 420 × 294 m map. */
export const SITE: Pt[] = [
  [40, 70],
  [170, 30],
  [330, 52],
  [392, 150],
  [350, 262],
  [170, 272],
  [60, 214],
]

export function footprint(alt: number) {
  return { across: (alt * CAMERA.sensorW) / CAMERA.focal, along: (alt * CAMERA.sensorH) / CAMERA.focal }
}

/** Ground sample distance in cm per pixel. */
export const gsd = (alt: number) => ((alt * CAMERA.sensorW) / (CAMERA.focal * CAMERA.imageW)) * 100

export function areaHa(poly: Pt[]) {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2 / 10000
}

function spanAt(poly: Pt[], y: number): [number, number] | null {
  const xs: number[] = []
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    if ((y >= y1 && y < y2) || (y >= y2 && y < y1)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
  }
  if (xs.length < 2) return null
  return [Math.min(...xs), Math.max(...xs)]
}

export type Plan = {
  lines: { y: number; x0: number; x1: number }[]
  path: Pt[]
  spacing: number
  distance: number
  photos: number
  minutes: number
  batteries: number
  gsd: number
  area: number
  across: number
  along: number
}

export function planSurvey(poly: Pt[], alt: number, overlap: number): Plan {
  const { across, along } = footprint(alt)
  const spacing = across * (1 - overlap)
  const trigger = along * (1 - overlap)
  const ys = poly.map((p) => p[1])
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const lines: Plan['lines'] = []
  for (let y = minY + spacing / 2; y < maxY; y += spacing) {
    const s = spanAt(poly, y)
    if (s) lines.push({ y, x0: s[0], x1: s[1] })
  }

  const path: Pt[] = []
  let photos = 0
  lines.forEach((l, i) => {
    const a: Pt = [l.x0, l.y]
    const b: Pt = [l.x1, l.y]
    path.push(...(i % 2 === 0 ? [a, b] : [b, a]))
    photos += Math.floor((l.x1 - l.x0) / trigger) + 1
  })

  let distance = 0
  for (let i = 1; i < path.length; i++) distance += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])
  const seconds = distance / CRUISE_MS + Math.max(0, lines.length - 1) * TURN_S
  const minutes = seconds / 60

  return {
    lines,
    path,
    spacing,
    distance,
    photos,
    minutes,
    batteries: Math.max(1, Math.ceil(minutes / BATTERY_MIN)),
    gsd: gsd(alt),
    area: areaHa(poly),
    across,
    along,
  }
}
