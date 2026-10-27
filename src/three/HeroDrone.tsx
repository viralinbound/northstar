import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Drone } from './Drone'
import type { Theme } from '../lib/theme'

type Props = { active: boolean; theme: Theme; onReady: () => void }

/** Hero backdrop: the aircraft hovering over a grid with its scanner on, leaning toward the pointer. */
export default function HeroDrone({ active, theme, onReady }: Props) {
  const light = theme === 'light'
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30, position: [0, 1.4, 6.2], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = light ? 1 : 1.2
        requestAnimationFrame(() => requestAnimationFrame(onReady))
      }}
      aria-hidden="true"
    >
      <hemisphereLight args={light ? ['#ffffff', '#b9b1a3', 1.3] : ['#9db8ff', '#160f1f', 1.1]} key={theme} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff3e2" />
      <directionalLight position={[-4, 1, -2]} intensity={light ? 0.7 : 1.6} color={light ? '#7c5cff' : '#9d7bff'} />
      <Scene light={light} />
    </Canvas>
  )
}

function Scene({ light }: { light: boolean }) {
  const rig = useRef<THREE.Group>(null)
  const cone = useRef<THREE.Mesh>(null)
  const spin = useRef(1)
  const pointer = useRef({ x: 0, y: 0 })
  const { camera, size } = useThree()
  const accent = light ? '#0b7cff' : '#3be3f6'

  // keep the drone in the gap between the headline and the form
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.setViewOffset(size.width, size.height, -size.width * 0.03, size.height * 0.2, size.width, size.height)
    cam.updateProjectionMatrix()
    return () => cam.clearViewOffset()
  }, [camera, size])

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const coneGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 4, 1, true)
    g.rotateY(Math.PI / 4)
    g.translate(0, -0.5, 0)
    return g
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const g = rig.current
    if (g) {
      g.position.y = 0.55 + Math.sin(t * 1.3) * 0.08
      g.rotation.y += (pointer.current.x * 0.6 - 0.35 + Math.sin(t * 0.3) * 0.15 - g.rotation.y) * 0.04
      g.rotation.x += (pointer.current.y * 0.18 + 0.12 - g.rotation.x) * 0.05
      g.rotation.z = Math.sin(t * 0.9) * 0.03
    }
    if (cone.current) {
      cone.current.position.y = (g?.position.y ?? 0.55) - 0.1
      ;(cone.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(t * 2) * 0.02
    }
  })

  return (
    <>
      <group ref={rig} scale={0.95}>
        <Drone spin={spin} />
      </group>
      <mesh ref={cone} geometry={coneGeo} scale={[1.2, 1.7, 0.9]}>
        <meshBasicMaterial color={accent} transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} blending={light ? THREE.NormalBlending : THREE.AdditiveBlending} />
      </mesh>
      <gridHelper args={[16, 32, accent, accent]} position={[0, -1.25, 0]}>
        <lineBasicMaterial attach="material" color={accent} transparent opacity={light ? 0.22 : 0.28} />
      </gridHelper>
    </>
  )
}
