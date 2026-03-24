import React from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import Road from '../components/environment/Road'
import useGameStore from '../store/gameStore'
import { ZONES } from './zones'

export default function GameCanvas() {
  const zone = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%', background: zoneData.bgColor }}
      gl={{ antialias: true }}
    >
      {/* Fixed camera: behind and above the player, looking slightly down-forward */}
      <PerspectiveCamera
        makeDefault
        position={[0, 5, 10]}
        fov={65}
        near={0.1}
        far={120}
      />

      {/* Depth fog — fades into zone atmosphere */}
      <fog attach="fog" args={[zoneData.fogColor, 20, 90]} />

      {/* Lighting */}
      <ambientLight intensity={0.35} color={zoneData.ambientColor} />
      <directionalLight
        castShadow
        position={[4, 12, 6]}
        intensity={1.2}
        color="#ffffff"
        shadow-mapSize={[1024, 1024]}
      />
      {/* Subtle fill from below to reduce harsh shadows */}
      <pointLight position={[0, 1, 4]} intensity={0.4} color={zoneData.ambientColor} />

      {/* Ground plane (extends beyond road edges) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} receiveShadow>
        <planeGeometry args={[60, 120]} />
        <meshStandardMaterial color="#111111" roughness={1} />
      </mesh>

      {/* Road */}
      <Road />
    </Canvas>
  )
}
