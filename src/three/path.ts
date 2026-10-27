import { CatmullRomCurve3, Vector3 } from 'three'

type Key = { t: number; drone: [number, number, number]; camOff: [number, number, number]; look: [number, number, number] }

// Hand-placed keyframes. Camera is an offset from the drone so the aircraft
// stays framed while the shot itself (angle, depth, height) changes.
const KEYS: Key[] = [
  { t: 0, drone: [0, 0.55, 0], camOff: [4.2, 1.4, 6], look: [0, 0.8, 0] },
  { t: 0.1, drone: [0, 0.55, 0], camOff: [2.8, 0.9, 4.4], look: [0, 0.8, 0] },
  { t: 0.22, drone: [0, 7, -3], camOff: [2.4, -5.2, 7], look: [0, 6.5, -3] },
  { t: 0.36, drone: [3, 15, -42], camOff: [-3.5, 2.2, 7.5], look: [3, 14, -50] },
  { t: 0.54, drone: [0, 26, -100], camOff: [6, 14, 10], look: [0, 4, -118] },
  { t: 0.7, drone: [-8, 25, -146], camOff: [-18, 13, 17], look: [0, 6, -162] },
  { t: 0.84, drone: [6, 28, -170], camOff: [24, 22, 26], look: [0, 5, -168] },
  { t: 0.93, drone: [2, 7, -210], camOff: [5, -3.5, 7], look: [0, 1.2, -219] },
  { t: 1, drone: [-0.8, 3, -217.4], camOff: [3.2, -1.7, 2.8], look: [0, 0.9, -219] },
]

const v = (a: [number, number, number]) => new Vector3(...a)
const droneCurve = new CatmullRomCurve3(KEYS.map((k) => v(k.drone)), false, 'centripetal')
const camCurve = new CatmullRomCurve3(KEYS.map((k) => v(k.drone).add(v(k.camOff))), false, 'centripetal')
const lookCurve = new CatmullRomCurve3(KEYS.map((k) => v(k.look)), false, 'centripetal')

/** Map page progress (0–1) to curve parameter so each keyframe lands on its `t`. */
function toCurveU(p: number): number {
  const n = KEYS.length - 1
  for (let i = 0; i < n; i++) {
    const a = KEYS[i].t
    const b = KEYS[i + 1].t
    if (p <= b) {
      const local = (p - a) / (b - a)
      // ease inside each segment so the motion settles at every keyframe
      const e = local * local * (3 - 2 * local)
      return (i + e) / n
    }
  }
  return 1
}

export function sampleFlight(p: number, drone: Vector3, cam: Vector3, look: Vector3) {
  const u = toCurveU(Math.min(1, Math.max(0, p)))
  droneCurve.getPoint(u, drone)
  camCurve.getPoint(u, cam)
  lookCurve.getPoint(u, look)
  return u
}

export function droneTangent(p: number, out: Vector3) {
  return droneCurve.getTangent(Math.min(0.999, Math.max(0.001, toCurveU(p))), out)
}
