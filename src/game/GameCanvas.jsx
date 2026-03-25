import React, { useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import Road from '../components/environment/Road'
import PlayerVehicle from '../components/player/PlayerVehicle'
import GameLoop from './GameLoop'
import ObstaclePool from '../components/obstacles/ObstaclePool'
import DronePool from '../components/enemies/DronePool'
import useGameStore from '../store/gameStore'
import { ZONES } from './zones'

// Owns the shared hit-cooldown so obstacles AND drones can't double-damage
function EnemySystems() {
  const hitCooldown = useRef(0)
  useFrame((_, delta) => { if (hitCooldown.current > 0) hitCooldown.current -= delta })
  return (
    <>
      <ObstaclePool hitCooldown={hitCooldown} />
      <DronePool hitCooldown={hitCooldown} />
    </>
  )
}

function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 3, 9)
    camera.lookAt(0, 0.5, -6)
    camera.fov = 65
    camera.updateProjectionMatrix()
  }, [camera])
  return null
}

// Updates Three.js fog color when zone changes (must live inside Canvas)
function ZoneFog() {
  const { scene } = useThree()
  const zone = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  useEffect(() => {
    if (scene.fog) {
      scene.fog.color.set(zoneData.fogColor)
    }
    scene.background?.set?.(zoneData.bgColor)
  }, [zone, scene, zoneData])

  return <fog attach="fog" args={[zoneData.fogColor, 25, 100]} />
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
      <ZoneFog />

      {/* Lighting */}
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight castShadow position={[5, 14, 8]} intensity={2.5} color="#ffffff"
        shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[0, 4, 12]} intensity={1.5} color="#cce0ff" />
      <pointLight position={[0, 1, 3]} intensity={1.2} color={zoneData.ambientColor} distance={20} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} receiveShadow>
        <planeGeometry args={[60, 120]} />
        <meshStandardMaterial color="#111111" roughness={1} />
      </mesh>

      {/* Game systems */}
      <GameLoop />
      <Road />
      <PlayerVehicle />
      <EnemySystems />
    </Canvas>
  )
}
