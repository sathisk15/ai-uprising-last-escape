import React, { useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Road from '../components/environment/Road'
import BuildingPool from '../components/environment/BuildingPool'
import PlayerVehicle from '../components/player/PlayerVehicle'
import GameLoop from './GameLoop'
import ObstaclePool from '../components/obstacles/ObstaclePool'
import DronePool from '../components/enemies/DronePool'
import BulletPool from '../components/combat/BulletPool'
import ExplosionPool from '../components/combat/ExplosionPool'
import DroneProjectilePool from '../components/combat/DroneProjectilePool'
import CollectiblePool from '../components/collectibles/CollectiblePool'
import useGameStore from '../store/gameStore'
import { ZONES } from './zones'
import { shakeSignal } from './shakeSignal'

// Owns the shared hit-cooldown so obstacles AND drones can't double-damage
function EnemySystems() {
  const hitCooldown = useRef(0)
  useFrame((_, delta) => { if (hitCooldown.current > 0) hitCooldown.current -= delta })
  return (
    <>
      <ObstaclePool hitCooldown={hitCooldown} />
      <DronePool hitCooldown={hitCooldown} />
      <BulletPool />
      <ExplosionPool />
      <DroneProjectilePool />
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

// Screen shake — triggered by shakeSignal.pending flag set from takeDamage
const BASE_CAM   = { x: 0, y: 3, z: 9 }
const SHAKE_MAG  = 0.22
const SHAKE_DUR  = 0.32

function CameraShake() {
  const { camera } = useThree()
  const shakeTimer = useRef(0)

  useFrame((_, delta) => {
    if (shakeSignal.pending) {
      shakeSignal.pending = false
      shakeTimer.current  = SHAKE_DUR
    }
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta
      const mag = SHAKE_MAG * (shakeTimer.current / SHAKE_DUR)
      camera.position.x = BASE_CAM.x + (Math.random() * 2 - 1) * mag
      camera.position.y = BASE_CAM.y + (Math.random() * 2 - 1) * mag * 0.5
      camera.position.z = BASE_CAM.z + (Math.random() * 2 - 1) * mag * 0.3
    } else {
      camera.position.x = BASE_CAM.x
      camera.position.y = BASE_CAM.y
      camera.position.z = BASE_CAM.z
    }
  })
  return null
}

// Updates fog + background when zone changes
function ZoneFog() {
  const { scene } = useThree()
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  useEffect(() => {
    if (scene.fog) scene.fog.color.set(zoneData.fogColor)
    scene.background?.set?.(zoneData.bgColor)
  }, [zone, scene, zoneData])

  return <fog attach="fog" args={[zoneData.fogColor, 30, 110]} />
}

export default function GameCanvas() {
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%', background: zoneData.bgColor }}
      gl={{ antialias: true, toneMappingExposure: 1.4 }}
      camera={{ position: [0, 3, 9], fov: 65, near: 0.1, far: 160 }}
    >
      <CameraSetup />
      <CameraShake />
      <ZoneFog />

      {/* ── Lighting ──────────────────────────────────────────────────────── */}
      {/* Hemisphere: sky vs ground bounce */}
      <hemisphereLight skyColor="#223366" groundColor="#110800" intensity={0.6} />

      {/* Main key light */}
      <ambientLight intensity={0.9} color="#ffffff" />
      <directionalLight
        castShadow
        position={[5, 14, 8]}
        intensity={2.2}
        color="#ffffff"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />
      {/* Fill / rim */}
      <directionalLight position={[0, 5, 14]} intensity={1.2} color="#aaccff" />
      <directionalLight position={[-8, 3, 0]} intensity={0.5} color={zoneData.ambientColor} />

      {/* Zone-tinted road-level point light */}
      <pointLight position={[0, 1.2, 3]} intensity={2.0} color={zoneData.ambientColor} distance={22} decay={2} />
      <pointLight position={[0, 1.2, -10]} intensity={1.0} color={zoneData.ambientColor} distance={18} decay={2} />

      {/* ── Ground plane (extends beyond road for shadow reception) ──────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} receiveShadow>
        <planeGeometry args={[80, 140]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* ── Game systems ──────────────────────────────────────────────────── */}
      <GameLoop />
      <Road />
      <BuildingPool />
      <PlayerVehicle />
      <EnemySystems />
      <CollectiblePool />

      {/* ── Post-processing ───────────────────────────────────────────────── */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.18}
          luminanceSmoothing={0.85}
          intensity={1.6}
          blendFunction={BlendFunction.ADD}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0008]}
        />
      </EffectComposer>
    </Canvas>
  )
}
