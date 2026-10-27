import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { rng } from '../lib/noise'
import type { ScenePalette } from './palette'

export type SiteUniforms = { uRecon: { value: number }; uTime: { value: number } }

type Block = { x: number; z: number; w: number; d: number; h: number; frame: boolean }

function layout(): Block[] {
  const r = rng(42)
  const out: Block[] = []
  for (let cx = 0; cx < 5; cx++) {
    for (let cz = 0; cz < 4; cz++) {
      if (r() < 0.12) continue
      const w = 5 + r() * 4
      const d = 4.5 + r() * 4
      const frame = r() < 0.3
      out.push({
        x: -28 + cx * 14 + (r() - 0.5) * 2,
        z: -142 - cz * 13 + (r() - 0.5) * 2,
        w,
        d,
        h: frame ? 5 + r() * 7 : 4 + r() * 15,
        frame,
      })
    }
  }
  return out
}

const pointVert = /* glsl */ `
  attribute float aRand;
  uniform float uRecon;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float on = smoothstep(aRand, aRand + 0.08, uRecon * 1.08);
    vAlpha = on * (0.55 + 0.45 * sin(uTime * 3.0 + aRand * 40.0));
    gl_PointSize = on * min(2.2 * (120.0 / -mv.z), 5.0);
    gl_Position = projectionMatrix * mv;
  }
`
const pointFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    gl_FragColor = vec4(uColor, vAlpha);
  }
`

function starShape(r: number, inner: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2
    const rad = i % 2 === 0 ? r : inner
    const x = Math.cos(a) * rad
    const y = Math.sin(a) * rad
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

export function LaunchPad({ palette }: { palette: ScenePalette }) {
  const star = useMemo(() => new THREE.ShapeGeometry(starShape(1.1, 0.28)), [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.4, 48]} />
        <meshStandardMaterial color={palette.pad} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[2.05, 2.15, 64]} />
        <meshBasicMaterial color="#f2c26b" />
      </mesh>
      <mesh geometry={star} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <meshBasicMaterial color="#f2c26b" transparent opacity={0.85} />
      </mesh>
      {/* pad edge lights */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 2.6, 0.05, Math.sin(a) * 2.6]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#3be3f6" />
          </mesh>
        )
      })}
      {/* ground-station case */}
      <mesh position={[-4.2, 0.25, -2.6]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.6]} />
        <meshStandardMaterial color={palette.station} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-4.2, 0.62, -2.6]} rotation={[-0.5, 0.5, 0]}>
        <boxGeometry args={[0.8, 0.02, 0.5]} />
        <meshBasicMaterial color="#1f6f78" />
      </mesh>
    </group>
  )
}

export function ConstructionSite({
  uniforms,
  edgesRef,
  palette,
}: {
  uniforms: SiteUniforms
  edgesRef: React.RefObject<THREE.LineBasicMaterial | null>
  palette: ScenePalette
}) {
  const blocks = useMemo(layout, [])
  const solids = useMemo(() => blocks.filter((b) => !b.frame), [blocks])
  const inst = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    solids.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d)
      m.setPosition(b.x, b.h / 2, b.z)
      inst.current?.setMatrixAt(i, m)
    })
    if (inst.current) inst.current.instanceMatrix.needsUpdate = true
  }, [solids])

  const { edges, frames, cloud } = useMemo(() => {
    const edgeGeos: THREE.BufferGeometry[] = []
    const frameGeos: THREE.BufferGeometry[] = []
    const r = rng(9)
    const pts: number[] = []
    const rand: number[] = []
    for (const b of blocks) {
      const box = new THREE.BoxGeometry(b.w, b.h, b.d)
      const e = new THREE.EdgesGeometry(box)
      e.translate(b.x, b.h / 2, b.z)
      edgeGeos.push(e)
      if (b.frame) {
        // floor slabs for structures still being built
        for (let y = 3; y < b.h; y += 3) {
          const slab = new THREE.EdgesGeometry(new THREE.BoxGeometry(b.w, 0.01, b.d))
          slab.translate(b.x, y, b.z)
          frameGeos.push(slab)
        }
        frameGeos.push(e.clone())
      }
      // scatter points across the visible faces for the reconstruction pass
      const n = Math.round((b.w * b.d + b.h * (b.w + b.d)) * 1.6)
      for (let i = 0; i < n; i++) {
        const face = r()
        let x: number, y: number, z: number
        if (face < 0.25) {
          x = (r() - 0.5) * b.w; y = b.h; z = (r() - 0.5) * b.d
        } else if (face < 0.625) {
          x = (r() < 0.5 ? -0.5 : 0.5) * b.w; y = r() * b.h; z = (r() - 0.5) * b.d
        } else {
          x = (r() - 0.5) * b.w; y = r() * b.h; z = (r() < 0.5 ? -0.5 : 0.5) * b.d
        }
        pts.push(b.x + x, y, b.z + z)
        // reveal bottom-up so the model "builds" as the drone passes
        rand.push(Math.min(0.98, (y / 20) * 0.6 + r() * 0.4))
      }
    }
    const cloud = new THREE.BufferGeometry()
    cloud.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    cloud.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 1))
    return { edges: mergeGeometries(edgeGeos), frames: mergeGeometries(frameGeos), cloud }
  }, [blocks])

  const additive = palette.points.additive
  const pointMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVert,
        fragmentShader: pointFrag,
        uniforms: { ...uniforms, uColor: { value: new THREE.Color() } },
        transparent: true,
        depthWrite: false,
        // glowing points at dusk; solid points read better against daylight
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [uniforms, additive],
  )
  pointMat.uniforms.uColor.value.set(palette.points.color)

  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, solids.length]}>
        <boxGeometry />
        <meshStandardMaterial color={palette.building} roughness={0.75} metalness={0.2} />
      </instancedMesh>
      <lineSegments geometry={frames}>
        <lineBasicMaterial color={palette.frame} transparent opacity={0.65} />
      </lineSegments>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={edgesRef} color={palette.accent} transparent opacity={0.08} depthWrite={false} />
      </lineSegments>
      <points geometry={cloud} material={pointMat} />
      <Crane position={[-10, 0, -150]} rotation={0.6} height={24} />
      <Crane position={[18, 0, -176]} rotation={-2.1} height={20} />
      {/* site slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -162]}>
        <planeGeometry args={[78, 60]} />
        <meshStandardMaterial color={palette.slab} roughness={1} />
      </mesh>
    </group>
  )
}

function Crane({ position, rotation, height }: { position: [number, number, number]; rotation: number; height: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.7, height, 0.7]} />
        <meshStandardMaterial color="#c9952f" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[5, height, 0]}>
        <boxGeometry args={[16, 0.5, 0.5]} />
        <meshStandardMaterial color="#c9952f" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-3.5, height - 0.4, 0]}>
        <boxGeometry args={[2, 1.2, 1]} />
        <meshStandardMaterial color="#2a313c" />
      </mesh>
      <mesh position={[10, height - 4, 0]}>
        <boxGeometry args={[0.04, 8, 0.04]} />
        <meshBasicMaterial color="#9aa3ad" />
      </mesh>
      <mesh position={[0, height + 0.5, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#ff5a4e" />
      </mesh>
    </group>
  )
}

export function Facility({ palette }: { palette: ScenePalette }) {
  return (
    <group position={[0, 0, -220]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
        <planeGeometry args={[34, 24]} />
        <meshStandardMaterial color={palette.facility} roughness={0.95} />
      </mesh>
      {/* walkway markings */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 2]}>
          <planeGeometry args={[0.08, 14]} />
          <meshBasicMaterial color="#f2c26b" transparent opacity={0.7} />
        </mesh>
      ))}
      {/* tanks */}
      {[-9, -4.5, 4.5, 9].map((x, i) => (
        <group key={x} position={[x, 0, -9 - (i % 2) * 2]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[1.8, 1.8, 6, 28]} />
            <meshStandardMaterial color="#a9b0ba" roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, 6.1, 0]}>
            <sphereGeometry args={[1.8, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#a9b0ba" roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ))}
      {/* pipe rack */}
      {[1.2, 2].map((y, i) => (
        <mesh key={y} position={[0, y, -5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18 - i * 0.04, 0.18 - i * 0.04, 26, 14]} />
          <meshStandardMaterial color={i ? '#c9952f' : '#5f6875'} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {[-12, -6, 0, 6, 12].map((x) => (
        <mesh key={x} position={[x, 1.1, -5]}>
          <boxGeometry args={[0.15, 2.2, 0.15]} />
          <meshStandardMaterial color="#39414d" />
        </mesh>
      ))}
      {/* charging dock behind the ground unit */}
      <mesh position={[0, 0.35, -2.2]}>
        <boxGeometry args={[1.6, 0.7, 0.5]} />
        <meshStandardMaterial color="#232a35" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, -1.94]}>
        <boxGeometry args={[1.2, 0.05, 0.02]} />
        <meshBasicMaterial color="#f2c26b" />
      </mesh>
    </group>
  )
}
