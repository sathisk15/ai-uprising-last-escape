import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import Road from '../components/environment/Road'
import PlayerVehicle from '../components/player/PlayerVehicle'
import useGameStore from '../store/gameStore'
import { ZONES } from './zones'

// Sets the camera to look forward down the road on mount
function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 3, 9)
    camera.lookAt(0, 0.5, -6)   // looking ahead down the road, not straight down
    camera.fov = 65
    camera.updateProjectionMatrix()
  }, [camera])
  return null
}

export default function GameCanvas() {
  const zone = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%', background: zoneData.bgColor }}
      gl={{ antialias: true }}
      camera={{ position: [0, 3, 9], fov: 65, near: 0.1, far: 150 }}
    >
      <CameraSetup />

      {/* Depth fog */}
      <fog attach="fog" args={[zoneData.fogColor, 25, 100]} />

      {/* ── Lighting ── */}
      {/* Bright ambient so car body is always visible */}
      <ambientLight intensity={1.2} color="#ffffff" />
      {/* Main sun from upper-front-left */}
      <directionalLight
        castShadow
        position={[5, 14, 8]}
        intensity={2.5}
        color="#ffffff"
        shadow-mapSize={[1024, 1024]}
      />
      {/* Fill light from front (illuminates the car grille / front) */}
      <directionalLight position={[0, 4, 12]} intensity={1.5} color="#cce0ff" />
      {/* Colored zone fill from below */}
      <pointLight position={[0, 1, 3]} intensity={1.2} color={zoneData.ambientColor} distance={20} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} receiveShadow>
        <planeGeometry args={[60, 120]} />
        <meshStandardMaterial color="#111111" roughness={1} />
      </mesh>

      {/* Road */}
      <Road />

      {/* Player */}
      <PlayerVehicle />
    </Canvas>
  )
}
