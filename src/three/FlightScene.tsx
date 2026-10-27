import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { Drone } from './Drone'
import { StudioEnv } from './StudioEnv'
import { Trees } from './Trees'
import { Robot } from './Robot'
import { Terrain, type TerrainUniforms } from './Terrain'
import { PALETTES, type ScenePalette } from './palette'
import type { Theme } from '../lib/theme'
import { Sky } from './Sky'
import { ConstructionSite, Facility, LaunchPad, type SiteUniforms } from './Site'
import { flight, smoothstep, windowed } from '../lib/flight'
import { sampleFlight, droneTangent } from './path'
import { terrainHeight } from '../lib/noise'

type Props = { active: boolean; compact: boolean; theme: Theme; onReady: () => void }

export default function FlightScene({ active, compact, theme, onReady }: Props) {
  const palette = PALETTES[theme]
  const maxDpr = 1.5
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio || 1, maxDpr))
  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: compact ? 58 : 46, near: 0.1, far: 1400, position: [4.2, 1.95, 6] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        requestAnimationFrame(() => requestAnimationFrame(onReady))
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(window.devicePixelRatio || 1, maxDpr))} />
      <Atmosphere palette={palette} />
      <hemisphereLight args={palette.hemi} key={theme} />
      <directionalLight position={[-60, 50, -90]} intensity={palette.sun[1]} color={palette.sun[0]} />
      <directionalLight position={[40, 30, 40]} intensity={palette.fill} color="#9cc7ff" />
      <StudioEnv warm={theme === 'dark'} intensity={theme === 'dark' ? 0.55 : 0.8} />
      <World compact={compact} palette={palette} />
    </Canvas>
  )
}

/** Background, fog and exposure follow the theme without remounting the scene. */
function Atmosphere({ palette }: { palette: ScenePalette }) {
  const { scene, gl } = useThree()
  useEffect(() => {
    const c = new THREE.Color(palette.fog)
    scene.background = c
    scene.fog = new THREE.Fog(c, 70, 360)
    gl.toneMappingExposure = palette.exposure
  }, [scene, gl, palette])
  return null
}

const tmp = {
  drone: new THREE.Vector3(),
  cam: new THREE.Vector3(),
  look: new THREE.Vector3(),
  tan: new THREE.Vector3(),
  prev: new THREE.Vector3(),
}

function World({ compact, palette }: { compact: boolean; palette: ScenePalette }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  useEffect(() => {
    const { width: w, height: h } = size
    if (compact) camera.setViewOffset(w, h, 0, h * 0.22, w, h)
    else camera.setViewOffset(w, h, -w * 0.12, -h * 0.06, w, h)
    camera.updateProjectionMatrix()
    return () => camera.clearViewOffset()
  }, [camera, size, compact])
  const drone = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const cone = useRef<THREE.Group>(null)
  const coneMat = useRef<THREE.MeshBasicMaterial>(null)
  const coneLine = useRef<THREE.LineBasicMaterial>(null)
  const edges = useRef<THREE.LineBasicMaterial>(null)
  const spin = useRef(0)
  const gait = useRef(0)
  const scan = useRef(0)
  const yaw = useRef(0)
  const speed = useRef(0)

  const terrainU = useMemo<TerrainUniforms>(
    () => ({
      uTime: { value: 0 },
      uGrid: { value: 0 },
      uScan: { value: 0 },
      uDrone: { value: new THREE.Vector3() },
      uFog: { value: new THREE.Color() },
      uLow: { value: new THREE.Color() },
      uMid: { value: new THREE.Color() },
      uHigh: { value: new THREE.Color() },
      uSunCol: { value: new THREE.Color() },
      uAmb: { value: 0.35 },
      uAccent: { value: new THREE.Color() },
    }),
    [],
  )
  terrainU.uFog.value.set(palette.fog)
  terrainU.uLow.value.set(palette.terrain.low)
  terrainU.uMid.value.set(palette.terrain.mid)
  terrainU.uHigh.value.set(palette.terrain.high)
  terrainU.uSunCol.value.set(palette.terrain.sun)
  terrainU.uAmb.value = palette.terrain.ambient
  terrainU.uAccent.value.set(palette.accent)
  const siteU = useMemo<SiteUniforms>(() => ({ uRecon: { value: 0 }, uTime: { value: 0 } }), [])

  const coneEdges = useMemo(() => {
    // four-sided sensor frustum, apex at origin, unit height downwards
    const g = new THREE.ConeGeometry(1, 1, 4, 1, true)
    g.rotateY(Math.PI / 4)
    g.translate(0, -0.5, 0)
    return { mesh: g, lines: new THREE.EdgesGeometry(g) }
  }, [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    // flight.current is eased by the DOM overlay loop (FlightSection) so text
    // and 3D stay in lockstep even before this scene has loaded.
    const p = flight.current

    sampleFlight(p, tmp.drone, tmp.cam, tmp.look)
    const airborne = smoothstep(0.1, 0.17, p)

    // drone body
    if (drone.current) {
      const d = drone.current
      tmp.prev.copy(d.position)
      d.position.copy(tmp.drone)
      d.position.y += Math.sin(t * 1.7) * 0.06 * airborne
      d.position.x += Math.sin(t * 0.9) * 0.04 * airborne

      droneTangent(p, tmp.tan)
      const horiz = Math.hypot(tmp.tan.x, tmp.tan.z)
      if (horiz > 0.25 && airborne > 0.5) {
        const target = Math.atan2(-tmp.tan.x, -tmp.tan.z)
        let delta = target - yaw.current
        delta = Math.atan2(Math.sin(delta), Math.cos(delta))
        yaw.current += delta * (1 - Math.exp(-dt * 2.5))
      } else if (airborne < 0.5) {
        yaw.current += (0 - yaw.current) * (1 - Math.exp(-dt * 2.5))
      }
      const v = Math.min(1, Math.abs(flight.velocity) * 6)
      const dir = Math.sign(flight.velocity) || 1
      const pitch = (-0.1 * airborne - 0.22 * v * dir) * (horiz > 0.25 ? 1 : 0.3)
      d.rotation.set(pitch, yaw.current, Math.sin(t * 0.8) * 0.03 * airborne, 'YXZ')

      const moved = d.position.distanceTo(tmp.prev) / Math.max(dt, 1e-4)
      speed.current += (moved - speed.current) * (1 - Math.exp(-dt * 3))
      flight.speed = speed.current
      flight.altitude = Math.max(0, tmp.drone.y - terrainHeight(tmp.drone.x, tmp.drone.z) - 0.55)
      flight.heading = ((-yaw.current * 180) / Math.PI + 360) % 360
    }
    spin.current = smoothstep(0.05, 0.13, p) * (1 - 0.35 * smoothstep(0.96, 1, p)) + 0.02

    // blob shadow under the drone, fading with altitude
    if (shadow.current) {
      const gy = terrainHeight(tmp.drone.x, tmp.drone.z)
      const alt = Math.max(0, tmp.drone.y - gy)
      shadow.current.position.set(tmp.drone.x, gy + 0.06, tmp.drone.z)
      shadow.current.scale.setScalar(1 + alt * 0.05)
      ;(shadow.current.material as THREE.MeshBasicMaterial).opacity = palette.shadow * Math.max(0, 1 - alt / 14)
    }

    // camera
    camera.position.copy(tmp.cam)
    camera.position.y += Math.sin(t * 0.5) * 0.05
    camera.lookAt(tmp.look)

    // mapping layers
    const scanAmt = windowed(0.36, 0.42, 0.82, 0.88, p)
    terrainU.uTime.value = t
    terrainU.uDrone.value.copy(tmp.drone)
    terrainU.uGrid.value = windowed(0.33, 0.44, 0.88, 0.96, p)
    terrainU.uScan.value = scanAmt
    siteU.uTime.value = t
    siteU.uRecon.value = smoothstep(0.6, 0.82, p)
    if (edges.current) edges.current.opacity = 0.08 + 0.75 * smoothstep(0.56, 0.76, p)

    if (cone.current && coneMat.current && coneLine.current) {
      const alt = Math.max(1, tmp.drone.y - terrainHeight(tmp.drone.x, tmp.drone.z))
      cone.current.position.set(tmp.drone.x, tmp.drone.y - 0.2, tmp.drone.z)
      cone.current.scale.set(alt * 0.62 * 1.414, alt, alt * 0.46 * 1.414)
      cone.current.visible = scanAmt > 0.01
      coneMat.current.opacity = 0.06 * scanAmt
      coneLine.current.opacity = 0.45 * scanAmt
    }

    gait.current = 0
    scan.current = smoothstep(0.9, 0.98, p)
  })

  return (
    <>
      <Sky starCount={compact ? 500 : 1200} palette={palette} />
      <Terrain uniforms={terrainU} segments={compact ? 140 : 220} />
      <Trees count={compact ? 700 : 1800} dark={palette.stars} />
      <LaunchPad palette={palette} />
      <ConstructionSite uniforms={siteU} edgesRef={edges} palette={palette} />
      <Facility palette={palette} />
      <group position={[0, 0, -219]}>
        <Robot gait={gait} scan={scan} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[0.7, 24]} />
          <meshBasicMaterial color="#000" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      </group>
      <Drone ref={drone} spin={spin} />
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <group ref={cone} visible={false}>
        <mesh geometry={coneEdges.mesh}>
          <meshBasicMaterial ref={coneMat} color={palette.accent} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <lineSegments geometry={coneEdges.lines}>
          <lineBasicMaterial ref={coneLine} color={palette.accent} transparent opacity={0} />
        </lineSegments>
      </group>
    </>
  )
}
