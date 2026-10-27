import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from '../lib/noise'

export type TerrainUniforms = {
  uTime: { value: number }
  uGrid: { value: number }
  uScan: { value: number }
  uDrone: { value: THREE.Vector3 }
  uFog: { value: THREE.Color }
  uLow: { value: THREE.Color }
  uMid: { value: THREE.Color }
  uHigh: { value: THREE.Color }
  uSunCol: { value: THREE.Color }
  uAmb: { value: number }
  uAccent: { value: THREE.Color }
}

const vert = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uGrid;
  uniform float uScan;
  uniform vec3 uDrone;
  uniform vec3 uFog;
  uniform vec3 uLow;
  uniform vec3 uMid;
  uniform vec3 uHigh;
  uniform vec3 uSunCol;
  uniform float uAmb;
  uniform vec3 uAccent;
  varying vec3 vWorld;
  varying vec3 vNormal;

  float line(float coord, float width) {
    float d = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    return 1.0 - min(d / width, 1.0);
  }

  void main() {
    vec3 n = normalize(vNormal);
    float h = vWorld.y;
    vec3 base = mix(uLow, uMid, smoothstep(-2.0, 10.0, h));
    base = mix(base, uHigh, smoothstep(22.0, 48.0, h));

    vec3 sunDir = normalize(vec3(-0.45, 0.55, -0.7));
    float diff = max(dot(n, sunDir), 0.0);
    float sky = 0.5 + 0.5 * n.y;
    vec3 col = base * (uAmb * sky + uSunCol * diff * 0.95);

    // mapping layer: contours + coordinate grid
    // mixed (not added) so the overlay reads on both dusk and daylight terrain
    float contour = line(h / 2.5, 1.0) * 0.35;
    float grid = max(line(vWorld.x / 10.0, 1.0), line(vWorld.z / 10.0, 1.0));
    col = mix(col, uAccent, clamp((grid * 0.22 + contour * 0.6) * uGrid, 0.0, 1.0));

    // live sensor footprint under the drone with a sweeping capture line
    vec2 rel = vWorld.xz - uDrone.xz;
    vec2 hs = vec2(uDrone.y * 0.62, uDrone.y * 0.46);
    vec2 inside = step(abs(rel), hs);
    float foot = inside.x * inside.y;
    float edge = foot * (1.0 - step(abs(rel.x), hs.x - 0.35) * step(abs(rel.y), hs.y - 0.35));
    float sweepZ = hs.y - fract(uTime * 0.35) * hs.y * 2.0;
    float sweep = foot * smoothstep(1.4, 0.0, abs(rel.y - sweepZ));
    float fine = max(line(vWorld.x / 2.5, 1.0), line(vWorld.z / 2.5, 1.0)) * foot;
    col = mix(col, uAccent, clamp((edge * 0.9 + sweep * 0.55 + fine * 0.18 + foot * 0.05) * uScan, 0.0, 1.0));

    float dist = length(vWorld - cameraPosition);
    float fog = 1.0 - exp(-pow(dist * 0.0052, 2.0));
    col = mix(col, uFog, clamp(fog, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Terrain({ uniforms, segments }: { uniforms: TerrainUniforms; segments: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(520, 560, segments, segments)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0, -160)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)))
    }
    g.computeVertexNormals()
    return g
  }, [segments])

  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms }),
    [uniforms],
  )

  return <mesh geometry={geometry} material={material} />
}
