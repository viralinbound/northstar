import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Drone } from './Drone'
import { BlobShadow } from './BlobShadow'
import { StudioEnv } from './StudioEnv'
import type { Theme } from '../lib/theme'
import { smoothstep } from '../lib/flight'

type Props = { progress: { current: number }; active: boolean; theme: Theme; onReady: () => void }

/** Turntable breakdown of the aircraft, driven by scroll progress (0–1). */
export default function DroneViewer({ progress, active, theme, onReady }: Props) {
  const light = theme === 'light'
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30, position: [3.1, 1.9, 3.4], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = light ? 1 : 1.15
        camera.lookAt(0, 0.05, 0)
        requestAnimationFrame(() => requestAnimationFrame(onReady))
      }}
      aria-hidden="true"
    >
      <hemisphereLight args={light ? ['#ffffff', '#b8b2a6', 1.3] : ['#9db8ff', '#1a1612', 1]} key={theme} />
      <directionalLight position={[3, 6, 3]} intensity={2.2} color="#fff3e2" />
      <directionalLight position={[-4, 2, -3]} intensity={light ? 0.8 : 1.4} color={light ? '#9cb4ff' : '#9d7bff'} />
      <StudioEnv intensity={light ? 0.9 : 1.1} />
      <Rig progress={progress} light={light} />
    </Canvas>
  )
}

function Rig({ progress, light }: { progress: { current: number }; light: boolean }) {
  const group = useRef<THREE.Group>(null)
  const explode = useRef(0)
  const spin = useRef(0.12)
  const ring = useRef<THREE.Mesh>(null)
  const ringGeo = useMemo(() => new THREE.RingGeometry(1.25, 1.27, 96), [])

  useFrame((state) => {
    const p = progress.current
    explode.current = smoothstep(0.04, 0.3, p) * (1 - smoothstep(0.88, 0.99, p))
    const g = group.current
    if (g) {
      g.rotation.y = -0.7 + p * Math.PI * 1.35 + Math.sin(state.clock.elapsedTime * 0.4) * 0.04
      g.rotation.x = 0.12 * Math.sin(p * Math.PI)
      g.position.y = 0.15 + Math.sin(state.clock.elapsedTime * 1.2) * 0.02
    }
    if (ring.current) ring.current.rotation.z += 0.002
  })

  return (
    <>
      <group ref={group} scale={1.22}>
        <Drone spin={spin} explode={explode} />
      </group>
      <mesh ref={ring} geometry={ringGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <meshBasicMaterial color={light ? '#0b7cff' : '#3be3f6'} transparent opacity={0.35} />
      </mesh>
      <BlobShadow size={2.6} opacity={light ? 0.22 : 0.45} y={-0.56} />
    </>
  )
}
