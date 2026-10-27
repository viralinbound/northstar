import { forwardRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const SEG = 0.3
const THIGH_REST = 0.75
const KNEE_REST = -1.5
export const ROBOT_STAND_HEIGHT = 2 * SEG * Math.cos(THIGH_REST) + 0.088 // hip offset + foot radius

type Props = {
  /** 0 = standing, 1 = full trot */
  gait: { current: number }
  /** 0 = off, 1 = LiDAR sweep visible */
  scan?: { current: number }
}

const LEGS: { x: number; z: number; phase: number }[] = [
  { x: 0.19, z: 0.33, phase: 0 },
  { x: -0.19, z: 0.33, phase: Math.PI },
  { x: 0.19, z: -0.33, phase: Math.PI },
  { x: -0.19, z: -0.33, phase: 0 },
]

/** Northstar ground unit — an original quadruped built from primitives (forward is +Z). */
export const Robot = forwardRef<THREE.Group, Props>(function Robot({ gait, scan }, ref) {
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const thighs = useRef<(THREE.Group | null)[]>([])
  const knees = useRef<(THREE.Group | null)[]>([])
  const ring = useRef<THREE.Mesh>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const phase = useRef(0)

  const m = useMemo(
    () => ({
      // anodised aluminium body, powder-coated covers, machined joints, rubber feet
      shell: new THREE.MeshPhysicalMaterial({ color: '#2b3038', roughness: 0.38, metalness: 0.85, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
      panel: new THREE.MeshPhysicalMaterial({ color: '#dfe2e7', roughness: 0.5, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
      joint: new THREE.MeshPhysicalMaterial({ color: '#1a1d22', roughness: 0.28, metalness: 1 }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#d9a441', roughness: 0.25, metalness: 1 }),
      visor: new THREE.MeshPhysicalMaterial({ color: '#04060a', roughness: 0.03, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0, emissive: '#ffb547', emissiveIntensity: 0.35 }),
      foot: new THREE.MeshPhysicalMaterial({ color: '#111317', roughness: 0.95, metalness: 0, sheen: 0.4 }),
    }),
    [],
  )
  const thighGeo = useMemo(() => new THREE.CapsuleGeometry(0.045, SEG - 0.06, 6, 12), [])
  const calfGeo = useMemo(() => new THREE.CapsuleGeometry(0.03, SEG - 0.05, 6, 10), [])

  useFrame((state, dt) => {
    const g = gait.current
    const t = state.clock.elapsedTime
    phase.current += Math.min(dt, 0.05) * (2 + g * 9)
    LEGS.forEach((leg, i) => {
      const p = phase.current + leg.phase
      const lift = Math.max(0, Math.sin(p))
      const swing = Math.cos(p) * 0.28 * g
      const th = thighs.current[i]
      const kn = knees.current[i]
      if (th) th.rotation.x = THIGH_REST + swing - lift * 0.32 * g
      if (kn) kn.rotation.x = KNEE_REST - lift * 0.55 * g
    })
    if (body.current) {
      body.current.position.y = ROBOT_STAND_HEIGHT + Math.sin(t * 1.6) * 0.006 + Math.abs(Math.sin(phase.current)) * 0.018 * g
      body.current.rotation.x = Math.sin(phase.current * 2) * 0.015 * g
    }
    const s = scan?.current ?? 0
    if (head.current) head.current.rotation.y = Math.sin(t * 0.9) * 0.35 * s
    if (ring.current && ringMat.current) {
      const k = (t * 0.55) % 1
      ring.current.scale.setScalar(0.4 + k * 5)
      ringMat.current.opacity = (1 - k) * 0.55 * s
    }
  })

  return (
    <group ref={ref}>
      <group ref={body} position={[0, ROBOT_STAND_HEIGHT, 0]}>
        {/* chassis */}
        <RoundedBox args={[0.34, 0.2, 0.86]} radius={0.05} smoothness={3} material={m.shell} />
        <RoundedBox args={[0.3, 0.05, 0.6]} radius={0.02} position={[0, 0.11, -0.04]} material={m.panel} />
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 0.172, 0.01, 0]} material={m.gold}>
            <boxGeometry args={[0.006, 0.025, 0.62]} />
          </mesh>
        ))}
        {/* rear handle */}
        <mesh position={[0, 0.17, -0.3]} rotation={[0, Math.PI / 2, 0]} material={m.joint}>
          <torusGeometry args={[0.06, 0.012, 8, 20, Math.PI]} />
        </mesh>

        {/* sensor head */}
        <group ref={head} position={[0, 0.02, 0.44]}>
          <RoundedBox args={[0.26, 0.15, 0.14]} radius={0.04} smoothness={3} material={m.panel} />
          <mesh position={[0, 0.01, 0.072]} material={m.visor}>
            <boxGeometry args={[0.2, 0.04, 0.01]} />
          </mesh>
          {[-0.065, 0.065].map((x) => (
            <mesh key={x} position={[x, -0.045, 0.072]} rotation={[Math.PI / 2, 0, 0]} material={m.joint}>
              <cylinderGeometry args={[0.018, 0.018, 0.01, 14]} />
            </mesh>
          ))}
          {/* LiDAR puck */}
          <mesh position={[0, 0.11, -0.03]} material={m.joint}>
            <cylinderGeometry args={[0.055, 0.06, 0.07, 22]} />
          </mesh>
          <mesh position={[0, 0.115, -0.03]} material={m.gold}>
            <cylinderGeometry args={[0.057, 0.057, 0.012, 22]} />
          </mesh>
        </group>

        {/* legs */}
        {LEGS.map((leg, i) => (
          <group key={i} position={[leg.x + Math.sign(leg.x) * 0.04, -0.05, leg.z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={m.joint}>
              <cylinderGeometry args={[0.055, 0.055, 0.08, 16]} />
            </mesh>
            <group ref={(el) => { thighs.current[i] = el }} rotation={[THIGH_REST, 0, 0]}>
              <mesh position={[0, -SEG / 2, 0]} geometry={thighGeo} material={m.shell} />
              <mesh position={[Math.sign(leg.x) * 0.046, -SEG / 2, 0]} material={m.gold}>
                <boxGeometry args={[0.004, 0.12, 0.03]} />
              </mesh>
              <group ref={(el) => { knees.current[i] = el }} position={[0, -SEG, 0]} rotation={[KNEE_REST, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]} material={m.joint}>
                  <cylinderGeometry args={[0.04, 0.04, 0.07, 14]} />
                </mesh>
                <mesh position={[0, -SEG / 2, 0]} geometry={calfGeo} material={m.panel} />
                <mesh position={[0, -SEG, 0]} material={m.foot}>
                  <sphereGeometry args={[0.038, 14, 12]} />
                </mesh>
              </group>
            </group>
          </group>
        ))}
      </group>

      {/* LiDAR sweep ring on the ground */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial ref={ringMat} color="#f2c26b" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
})
