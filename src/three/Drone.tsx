import { forwardRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const ARM = 0.62
const MOTORS: [number, number][] = [
  [ARM, -0.48],
  [-ARM, -0.48],
  [ARM, 0.48],
  [-ARM, 0.48],
]

type Props = {
  spin: { current: number }
  /** 0 = assembled, 1 = fully exploded (used by the aircraft breakdown section) */
  explode?: { current: number }
}

/** Northstar survey quadcopter, built from primitives (forward is −Z). */
export const Drone = forwardRef<THREE.Group, Props>(function Drone({ spin, explode }, ref) {
  const props = useRef<(THREE.Group | null)[]>([])
  const discs = useRef<(THREE.Mesh | null)[]>([])
  const arms = useRef<(THREE.Group | null)[]>([])
  const rotors = useRef<(THREE.Group | null)[]>([])
  const top = useRef<THREE.Group>(null)
  const gimbal = useRef<THREE.Group>(null)
  const legs = useRef<THREE.Group>(null)
  const battery = useRef<THREE.Group>(null)
  const beacon = useRef<THREE.MeshBasicMaterial>(null)

  const mats = useMemo(
    () => ({
      // injection-moulded shell with a clear lacquer, like real airframes
      shell: new THREE.MeshPhysicalMaterial({ color: '#e7eaee', roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.2 }),
      // carbon / anodised parts
      dark: new THREE.MeshPhysicalMaterial({ color: '#16191f', roughness: 0.32, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
      blade: new THREE.MeshPhysicalMaterial({ color: '#1d2027', roughness: 0.55, metalness: 0, clearcoat: 0.3 }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#d9a441', roughness: 0.22, metalness: 1 }),
      // camera glass: dark coated optic with a faint cyan coating reflection
      lens: new THREE.MeshPhysicalMaterial({ color: '#05070b', roughness: 0.02, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0, iridescence: 0.6, iridescenceIOR: 1.6 }),
      cell: new THREE.MeshPhysicalMaterial({ color: '#2a2f38', roughness: 0.6, metalness: 0.1 }),
      disc: new THREE.MeshBasicMaterial({ color: '#c9d4e3', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    }),
    [],
  )

  useFrame((state, dt) => {
    const s = spin.current
    const speed = 6 + s * 70
    props.current.forEach((p, i) => {
      if (p) p.rotation.y += (i % 2 ? -1 : 1) * speed * Math.min(dt, 0.05)
    })
    discs.current.forEach((d) => {
      if (d) (d.material as THREE.MeshBasicMaterial).opacity = 0.05 + s * 0.16
    })
    if (beacon.current) beacon.current.opacity = 0.55 + 0.45 * Math.max(0, Math.sin(state.clock.elapsedTime * 5))

    const e = explode?.current ?? 0
    if (!explode) return
    MOTORS.forEach(([x, z], i) => {
      const len = Math.hypot(x, z)
      arms.current[i]?.position.set((x / len) * 0.38 * e, 0, (z / len) * 0.38 * e)
      rotors.current[i]?.position.set(0, 0.42 * e, 0)
    })
    top.current?.position.set(0, 0.5 * e, 0)
    gimbal.current?.position.set(0, -0.12 - 0.42 * e, -0.3 - 0.25 * e)
    legs.current?.position.set(0, -0.38 * e, 0)
    battery.current?.position.set(0, 0, 0.12 + 0.8 * e)
  })

  return (
    <group ref={ref}>
      {/* fuselage */}
      <RoundedBox args={[0.42, 0.16, 0.78]} radius={0.06} smoothness={3} material={mats.shell} />

      {/* flight computer / top plate */}
      <group ref={top}>
        <RoundedBox args={[0.3, 0.06, 0.5]} radius={0.025} position={[0, 0.1, 0.04]} material={mats.dark} />
        <mesh position={[0, 0.135, -0.05]} material={mats.gold}>
          <boxGeometry args={[0.05, 0.012, 0.36]} />
        </mesh>
        <mesh position={[0, 0.06, 0.04]} material={mats.cell}>
          <boxGeometry args={[0.2, 0.02, 0.3]} />
        </mesh>
      </group>

      {/* battery, hidden inside the body until exploded */}
      <group ref={battery} position={[0, 0, 0.12]}>
        <RoundedBox args={[0.3, 0.1, 0.34]} radius={0.02} material={mats.cell} />
        <mesh position={[0, 0.052, 0.12]} material={mats.gold}>
          <boxGeometry args={[0.22, 0.006, 0.04]} />
        </mesh>
      </group>

      {/* arms + motors + props */}
      {MOTORS.map(([x, z], i) => {
        const len = Math.hypot(x, z)
        const ang = Math.atan2(x, z)
        return (
          <group key={i} ref={(el) => { arms.current[i] = el }}>
            <mesh position={[x / 2, 0.02, z / 2]} rotation={[0, ang, 0]} material={mats.shell}>
              <boxGeometry args={[0.07, 0.05, len]} />
            </mesh>
            <mesh position={[x, 0.05, z]} material={mats.dark}>
              <cylinderGeometry args={[0.07, 0.075, 0.1, 18]} />
            </mesh>
            {z < 0 && (
              <mesh position={[x, 0.05, z - 0.08]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#ffd27a" />
              </mesh>
            )}
            <group ref={(el) => { rotors.current[i] = el }}>
              <mesh position={[x, 0.105, z]} material={mats.gold}>
                <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
              </mesh>
              <group ref={(el) => { props.current[i] = el }} position={[x, 0.12, z]}>
                <mesh material={mats.blade} rotation={[0, 0, 0.06]}>
                  <boxGeometry args={[0.62, 0.008, 0.055]} />
                </mesh>
              </group>
              <mesh
                ref={(el) => { discs.current[i] = el }}
                position={[x, 0.122, z]}
                rotation={[-Math.PI / 2, 0, 0]}
                material={mats.disc}
              >
                <circleGeometry args={[0.31, 32]} />
              </mesh>
            </group>
          </group>
        )
      })}

      {/* gimbal + survey camera */}
      <group ref={gimbal} position={[0, -0.12, -0.3]}>
        <mesh material={mats.dark}>
          <boxGeometry args={[0.1, 0.06, 0.08]} />
        </mesh>
        <mesh position={[0, -0.07, 0]} material={mats.dark}>
          <sphereGeometry args={[0.075, 20, 16]} />
        </mesh>
        <mesh position={[0, -0.07, -0.065]} rotation={[Math.PI / 2, 0, 0]} material={mats.lens}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 20]} />
        </mesh>
      </group>

      {/* landing skids */}
      <group ref={legs}>
        {[-0.17, 0.17].map((x) => (
          <group key={x}>
            <mesh position={[x, -0.15, 0.12]} material={mats.dark}>
              <boxGeometry args={[0.025, 0.14, 0.025]} />
            </mesh>
            <mesh position={[x, -0.15, -0.12]} material={mats.dark}>
              <boxGeometry args={[0.025, 0.14, 0.025]} />
            </mesh>
            <mesh position={[x, -0.22, 0]} material={mats.dark}>
              <boxGeometry args={[0.03, 0.025, 0.46]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* aft beacon (gold nav lights sit on the front arms) */}
      <mesh position={[0, 0.06, 0.4]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial ref={beacon} color="#3be3f6" transparent />
      </mesh>
    </group>
  )
})
