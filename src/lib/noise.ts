// Small deterministic value-noise + fbm, enough for terrain and scatter.

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function noise(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

export function fbm(x: number, y: number, octaves = 5) {
  let v = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < octaves; i++) {
    v += amp * noise(x * f, y * f)
    f *= 2.02
    amp *= 0.5
  }
  return v
}

/** Seeded PRNG so scatter layouts are stable between renders. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Flat zones: launch pad, construction site, ground-robot facility.
const ZONES: [number, number, number, number][] = [
  [0, 0, 16, 34],
  [0, -162, 44, 72],
  [0, -220, 24, 46],
]

/** Terrain height in world units. Valley along x≈0 (the flight corridor). */
export function terrainHeight(x: number, z: number) {
  const ax = Math.abs(x)
  const hills = (fbm(x * 0.014 + 3.1, z * 0.014 - 1.7) - 0.35) * 16 + fbm(x * 0.05, z * 0.05, 3) * 2.2
  const corridor = 0.3 + 0.7 * sstep(10, 70, ax)
  const ridge = sstep(30, 150, ax) * 46 * (0.45 + 0.55 * fbm(x * 0.007 + 9, z * 0.007))
  let h = hills * corridor + ridge
  for (const [cx, cz, r0, r1] of ZONES) {
    const d = Math.hypot(x - cx, z - cz)
    const k = 1 - sstep(r0, r1, d)
    h = h * (1 - k)
  }
  return h
}
