import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { rng, terrainHeight } from '../lib/noise'

// keep the flight corridor, launch pad, site and facility clear
const CLEAR: [number, number, number][] = [
  [0, 0, 30],
  [0, -162, 70],
  [0, -220, 44],
]

/** Instanced conifers scattered over the hills for a real landscape read from the air. */
export function Trees({ count, dark }: { count: number; dark: boolean }) {
  const crowns = useRef<THREE.InstancedMesh>(null)
  const trunks = useRef<THREE.InstancedMesh>(null)

  const placements = useMemo(() => {
    const r = rng(1234)
    const out: { x: number; y: number; z: number; s: number; rot: number }[] = []
    let guard = 0
    while (out.length < count && guard++ < count * 20) {
      const x = (r() - 0.5) * 460
      const z = 60 - r() * 480
      if (Math.abs(x) < 14) continue
      if (CLEAR.some(([cx, cz, rad]) => Math.hypot(x - cx, z - cz) < rad)) continue
      const y = terrainHeight(x, z)
      if (y > 40) continue // bare ridge tops
      // clumps: denser where a low-frequency field is high
      const clump = Math.sin(x * 0.045) * Math.cos(z * 0.038) * 0.5 + 0.5
      if (r() > 0.25 + clump * 0.75) continue
      out.push({ x, y, z, s: 0.7 + r() * 0.9, rot: r() * Math.PI })
    }
    return out
  }, [count])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const v = new THREE.Vector3()
    const sc = new THREE.Vector3()
    const col = new THREE.Color()
    const r = rng(77)
    placements.forEach((p, i) => {
      q.setFromEuler(new THREE.Euler(0, p.rot, 0))
      sc.set(p.s, p.s * (0.9 + r() * 0.5), p.s)
      m.compose(v.set(p.x, p.y + 2.6 * sc.y, p.z), q, sc)
      crowns.current?.setMatrixAt(i, m)
      m.compose(v.set(p.x, p.y + 0.6 * sc.y, p.z), q, sc)
      trunks.current?.setMatrixAt(i, m)
      // slight per-tree colour variation
      col.setHSL(dark ? 0.36 : 0.3 + r() * 0.06, dark ? 0.25 : 0.35, dark ? 0.08 + r() * 0.04 : 0.22 + r() * 0.08)
      crowns.current?.setColorAt(i, col)
    })
    ;[crowns.current, trunks.current].forEach((im) => {
      if (!im) return
      im.instanceMatrix.needsUpdate = true
      if (im.instanceColor) im.instanceColor.needsUpdate = true
    })
  }, [placements, dark])

  return (
    <group>
      <instancedMesh ref={crowns} args={[undefined, undefined, placements.length]} frustumCulled={false}>
        <coneGeometry args={[1.5, 4.6, 7]} />
        <meshStandardMaterial roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, placements.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.18, 0.24, 1.2, 5]} />
        <meshStandardMaterial color={dark ? '#1a140f' : '#4a3626'} roughness={1} />
      </instancedMesh>
    </group>
  )
}
