import { Environment, Lightformer } from '@react-three/drei'

/**
 * Reflection environment built from light panels, like a photo studio.
 * Gives metal, glass and clear-coat real highlights without downloading an HDR file.
 */
export function StudioEnv({ warm = false, intensity = 1 }: { warm?: boolean; intensity?: number }) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <color attach="background" args={['#0a0d14']} />
      {/* big soft key overhead */}
      <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} color="#ffffff" />
      {/* strip lights either side for long edge highlights */}
      <Lightformer form="rect" intensity={2.2} position={[-6, 1.5, 0]} rotation-y={Math.PI / 2} scale={[8, 1.2, 1]} color={warm ? '#ffd6a0' : '#dbe8ff'} />
      <Lightformer form="rect" intensity={1.6} position={[6, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[8, 1.2, 1]} color="#ffffff" />
      {/* low rim from behind */}
      <Lightformer form="ring" intensity={1.4} position={[0, 0.5, -7]} scale={4} color={warm ? '#ffb46b' : '#9cc4ff'} />
      {/* faint floor bounce */}
      <Lightformer form="rect" intensity={0.5} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color="#8a8f99" />
    </Environment>
  )
}
