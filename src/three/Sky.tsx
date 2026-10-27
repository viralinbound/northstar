import { useMemo } from 'react'
import * as THREE from 'three'
import { rng } from '../lib/noise'
import type { ScenePalette } from './palette'

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  varying vec3 vDir;
  void main() {
    float y = vDir.y;
    vec3 col = mix(uMid, uZenith, smoothstep(0.08, 0.6, y));
    // warm band strongest toward the sun side (−X, −Z)
    float sunSide = 0.55 + 0.45 * max(0.0, dot(normalize(vDir.xz + 1e-4), normalize(vec2(-0.5, -0.86))));
    col = mix(col, uHorizon, (1.0 - smoothstep(-0.02, 0.2, y)) * 0.75 * sunSide);
    col = mix(col, uGround, smoothstep(0.0, -0.15, y));
    gl_FragColor = vec4(col, 1.0);
  }
`

/** North-star sprite: brand motif that sits ahead of the flight path. */
function starTexture() {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(255,240,210,1)')
  grad.addColorStop(0.12, 'rgba(255,214,140,0.85)')
  grad.addColorStop(0.4, 'rgba(242,194,107,0.12)')
  grad.addColorStop(1, 'rgba(242,194,107,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = 'rgba(255,230,180,0.9)'
  // four-point flare
  g.beginPath()
  g.moveTo(s / 2, 2); g.lineTo(s / 2 + 3, s / 2); g.lineTo(s / 2, s - 2); g.lineTo(s / 2 - 3, s / 2); g.closePath(); g.fill()
  g.beginPath()
  g.moveTo(2, s / 2); g.lineTo(s / 2, s / 2 + 3); g.lineTo(s - 2, s / 2); g.lineTo(s / 2, s / 2 - 3); g.closePath(); g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function Sky({ starCount, palette }: { starCount: number; palette: ScenePalette }) {
  const stars = useMemo(() => {
    const r = rng(7)
    const p = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const th = r() * Math.PI * 2
      const y = 0.12 + r() * 0.88
      const rad = Math.sqrt(1 - y * y)
      p[i * 3] = Math.cos(th) * rad * 560
      p[i * 3 + 1] = y * 560
      p[i * 3 + 2] = Math.sin(th) * rad * 560 - 160
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [starCount])
  const tex = useMemo(starTexture, [])
  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color() },
      uMid: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() },
    }),
    [],
  )
  uniforms.uZenith.value.set(palette.sky.zenith)
  uniforms.uMid.value.set(palette.sky.mid)
  uniforms.uHorizon.value.set(palette.sky.horizon)
  uniforms.uGround.value.set(palette.sky.ground)

  return (
    <group>
      <mesh position={[0, 0, -160]}>
        <sphereGeometry args={[620, 32, 16]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <points geometry={stars} visible={palette.stars}>
        <pointsMaterial size={1.3} sizeAttenuation={false} color="#cfd9ec" transparent opacity={0.7} depthWrite={false} fog={false} />
      </points>
      <sprite position={[-40, 210, -620]} scale={[70, 70, 1]} visible={palette.stars}>
        <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  )
}
