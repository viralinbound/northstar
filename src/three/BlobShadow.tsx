import { useMemo } from 'react'
import * as THREE from 'three'

/** Soft ground shadow from a pre-baked radial gradient: far cheaper than re-rendering contact shadows each frame. */
export function BlobShadow({ size = 2, opacity = 0.5, y = 0 }: { size?: number; opacity?: number; y?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(0.45, 'rgba(0,0,0,0.55)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[size, size * 0.8]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}
