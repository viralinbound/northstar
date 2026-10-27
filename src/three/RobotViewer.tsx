import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Robot } from './Robot'
import { BlobShadow } from './BlobShadow'
import type { Theme } from '../lib/theme'

export type RobotMode = 'stand' | 'walk' | 'scan'

type Props = { mode: RobotMode; active: boolean; theme: Theme; onReady: () => void }

const floorVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const floorFrag = /* glsl */ `
  uniform float uOffset;
  uniform vec3 uColor;
  uniform float uAlpha;
  varying vec2 vUv;
  float line(float c) { float d = abs(fract(c - 0.5) - 0.5) / fwidth(c); return 1.0 - min(d, 1.0); }
  void main() {
    vec2 p = (vUv - 0.5) * 12.0;
    float g = max(line(p.x), line(p.y + uOffset));
    float fade = 1.0 - smoothstep(1.5, 5.5, length(p));
    gl_FragColor = vec4(uColor, g * uAlpha * fade);
  }
`

/** Interactive ground-unit viewer: drag/swipe sideways to turn, modes change behaviour. */
export default function RobotViewer({ mode, active, theme, onReady }: Props) {
  const light = theme === 'light'
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 32, position: [2.4, 1.25, 2.6], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        camera.lookAt(0, 0.35, 0)
        requestAnimationFrame(() => requestAnimationFrame(onReady))
      }}
      aria-hidden="true"
    >
      <hemisphereLight args={light ? ['#fff6e8', '#b9ab95', 1.2] : ['#ffe7c2', '#1b1e26', 0.8]} key={theme} />
      <directionalLight position={[3, 5, 2]} intensity={2.1} color="#fff1dc" />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#f2c26b" />
      <Stage mode={mode} light={light} />
    </Canvas>
  )
}

function Stage({ mode, light }: { mode: RobotMode; light: boolean }) {
  const turntable = useRef<THREE.Group>(null)
  const gait = useRef(0)
  const scan = useRef(0)
  const drag = useRef({ x: 0, active: false, target: -0.5, vel: 0 })
  const uniforms = useMemo(
    () => ({ uOffset: { value: 0 }, uColor: { value: new THREE.Color() }, uAlpha: { value: 0.35 } }),
    [],
  )
  uniforms.uColor.value.set(light ? '#7c5cff' : '#ffc35a')
  uniforms.uAlpha.value = light ? 0.45 : 0.35

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    gait.current += ((mode === 'walk' ? 1 : 0) - gait.current) * (1 - Math.exp(-dt * 3))
    scan.current += ((mode === 'scan' ? 1 : 0) - scan.current) * (1 - Math.exp(-dt * 3))
    uniforms.uOffset.value -= dt * 1.6 * gait.current
    const d = drag.current
    if (!d.active) d.target += dt * 0.12 // slow idle turn
    if (turntable.current) turntable.current.rotation.y += (d.target - turntable.current.rotation.y) * (1 - Math.exp(-dt * 6))
  })

  return (
    <group>
      {/* invisible hit area for sideways drag; vertical swipes still scroll the page */}
      <mesh
        position={[0, 0.5, 0]}
        onPointerDown={(e) => {
          drag.current.active = true
          drag.current.x = e.clientX
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current.active) return
          drag.current.target += (e.clientX - drag.current.x) * 0.008
          drag.current.x = e.clientX
        }}
        onPointerUp={() => (drag.current.active = false)}
        onPointerCancel={() => (drag.current.active = false)}
        onPointerLeave={() => (drag.current.active = false)}
      >
        <boxGeometry args={[3, 1.6, 3]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <group ref={turntable}>
        <Robot gait={gait} scan={scan} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <planeGeometry args={[6, 6]} />
          <shaderMaterial vertexShader={floorVert} fragmentShader={floorFrag} uniforms={uniforms} transparent depthWrite={false} />
        </mesh>
      </group>
      <BlobShadow size={1.7} opacity={light ? 0.3 : 0.55} y={0.004} />
    </group>
  )
}
