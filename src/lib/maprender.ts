import { fbm, rng, terrainHeight } from './noise'

/**
 * Procedural "survey outputs" rendered from the same terrain the 3D flight uses.
 * Demo data only: nothing here is a photo or a real site.
 */
export const MAP_W = 600
export const MAP_H = 420
export const MAP_M = { w: 420, h: 294 } // metres covered by the map
const X0 = -210
const Z0 = -40

export type Layer = 'ortho' | 'elevation' | 'contours' | 'change'

type Field = { h: Float32Array; min: number; max: number; shade: Float32Array }

let fieldPromise: Promise<Field> | null = null

const toWorld = (px: number, py: number): [number, number] => [X0 + (px / MAP_W) * MAP_M.w, Z0 - (py / MAP_H) * MAP_M.h]

/** Heights + hillshade, computed in row chunks so the page never stalls. */
export function getField(): Promise<Field> {
  if (fieldPromise) return fieldPromise
  fieldPromise = new Promise((resolve) => {
    const h = new Float32Array(MAP_W * MAP_H)
    let row = 0
    const step = () => {
      const end = Math.min(MAP_H, row + 24)
      for (; row < end; row++) {
        for (let x = 0; x < MAP_W; x++) {
          const [wx, wz] = toWorld(x, row)
          h[row * MAP_W + x] = terrainHeight(wx, wz)
        }
      }
      if (row < MAP_H) {
        setTimeout(step, 0)
        return
      }
      let min = Infinity
      let max = -Infinity
      for (const v of h) {
        if (v < min) min = v
        if (v > max) max = v
      }
      const cell = MAP_M.w / MAP_W
      const shade = new Float32Array(MAP_W * MAP_H)
      const sun = norm([-0.55, 0.62, -0.56])
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const l = h[y * MAP_W + Math.max(0, x - 1)]
          const r = h[y * MAP_W + Math.min(MAP_W - 1, x + 1)]
          const u = h[Math.max(0, y - 1) * MAP_W + x]
          const d = h[Math.min(MAP_H - 1, y + 1) * MAP_W + x]
          const n = norm([-(r - l) / (2 * cell), 1, (d - u) / (2 * cell)])
          shade[y * MAP_W + x] = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2])
        }
      }
      resolve({ h, min, max, shade })
    }
    step()
  })
  return fieldPromise
}

function norm(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}

const hex = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
const mix = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const RAMP = ['#0b3c5d', '#1a8fa0', '#7fc8a9', '#e8d77a', '#f2a25b', '#c95a3a', '#f4ede2'].map(hex)
function ramp(t: number) {
  const f = Math.min(0.9999, Math.max(0, t)) * (RAMP.length - 1)
  const i = Math.floor(f)
  return mix(RAMP[i], RAMP[i + 1], f - i)
}

// Simple site features so the ortho reads like a real job site.
const ROOFS = (() => {
  const r = rng(11)
  const out: { x: number; y: number; w: number; h: number; c: number[] }[] = []
  for (let i = 0; i < 14; i++) {
    out.push({
      x: 168 + r() * 80,
      y: 100 + r() * 70,
      w: 10 + r() * 16,
      h: 8 + r() * 14,
      c: r() < 0.5 ? [196, 199, 204] : r() < 0.5 ? [150, 96, 72] : [94, 112, 128],
    })
  }
  return out
})()

const cache = new Map<string, HTMLCanvasElement>()

export async function renderLayer(layer: Layer, theme: 'light' | 'dark'): Promise<HTMLCanvasElement> {
  const key = `${layer}:${layer === 'contours' ? theme : ''}`
  const hit = cache.get(key)
  if (hit) return hit
  const f = await getField()
  const c = document.createElement('canvas')
  c.width = MAP_W
  c.height = MAP_H
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(MAP_W, MAP_H)
  const d = img.data
  const span = f.max - f.min || 1
  const paper = theme === 'light' ? [246, 243, 236] : [12, 18, 30]
  const ink = theme === 'light' ? [40, 52, 66] : [140, 210, 220]

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = y * MAP_W + x
      const hgt = f.h[i]
      const sh = f.shade[i]
      const mx = (x / MAP_W) * MAP_M.w
      const my = (y / MAP_H) * MAP_M.h
      let col: number[]

      if (layer === 'elevation') {
        col = ramp((hgt - f.min) / span).map((v) => v * (0.72 + 0.4 * sh))
      } else if (layer === 'contours') {
        const r = f.h[y * MAP_W + Math.min(MAP_W - 1, x + 1)]
        const b = f.h[Math.min(MAP_H - 1, y + 1) * MAP_W + x]
        const minor = Math.floor(hgt / 2) !== Math.floor(r / 2) || Math.floor(hgt / 2) !== Math.floor(b / 2)
        const major = Math.floor(hgt / 10) !== Math.floor(r / 10) || Math.floor(hgt / 10) !== Math.floor(b / 10)
        col = mix(paper, ink, major ? 0.95 : minor ? 0.4 : 0)
        col = mix(col, ramp((hgt - f.min) / span), 0.12)
      } else {
        col = ortho(mx, my, hgt, sh)
        if (layer === 'change') {
          const g = (col[0] + col[1] + col[2]) / 3
          col = mix(col, [g, g, g], 0.75).map((v) => v * 0.9)
          const n = fbm(mx * 0.02 + 40, my * 0.02 + 7, 3)
          const inSite = ss(120, 80, Math.hypot(mx - 210, my - 140))
          if (n > 0.62 && inSite > 0.2) col = mix(col, [217, 74, 58], 0.75 * inSite) // material removed
          else if (n < 0.32 && inSite > 0.2) col = mix(col, [26, 165, 179], 0.75 * inSite) // material added
        }
      }
      d[i * 4] = col[0]
      d[i * 4 + 1] = col[1]
      d[i * 4 + 2] = col[2]
      d[i * 4 + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  cache.set(key, c)
  return c
}

function ortho(mx: number, my: number, hgt: number, sh: number) {
  const veg = fbm(mx * 0.03, my * 0.03, 4)
  const grit = fbm(mx * 0.4, my * 0.4, 2)
  let col = mix([176, 160, 128], [104, 126, 78], ss(0.42, 0.62, veg))
  col = mix(col, [150, 146, 132], ss(10, 30, hgt) * 0.5)
  // gravel pad around the works
  const pad = 1 - ss(70, 95, Math.hypot(mx - 210, my - 140))
  col = mix(col, [168, 164, 154], pad)
  // haul road
  const roadY = 222 + Math.sin(mx * 0.018) * 18
  const road = 1 - ss(4, 6, Math.abs(my - roadY))
  col = mix(col, [88, 88, 90], road)
  for (const r of ROOFS) {
    if (mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h) col = r.c
  }
  const tone = 0.55 + 0.62 * sh + (grit - 0.5) * 0.12
  return col.map((v) => Math.min(255, v * tone))
}
