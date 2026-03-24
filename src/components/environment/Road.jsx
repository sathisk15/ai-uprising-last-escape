import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

const TILE_LENGTH = 64
const ROAD_WIDTH = 8
// Recycle when the tile's back edge (center - TILE_LENGTH/2) clears the camera.
// Camera is at z≈9, so threshold = 9 + 32 = 41. Use 50 for a safe margin.
const RECYCLE_Z = 50

function LaneDivider({ x }) {
  const segLen = 2.2
  const gap = 2.8
  const step = segLen + gap
  const count = Math.ceil(TILE_LENGTH / step) + 1

  return (
    <group position={[x, 0.12, -TILE_LENGTH / 2 + segLen / 2]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0, i * step]}>
          <boxGeometry args={[0.07, 0.01, segLen]} />
          <meshStandardMaterial color="#dddd00" emissive="#777700" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function RoadGeometry() {
  return (
    <>
      {/* Surface — 1 unit extra on each end to hide seam */}
      <mesh receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.2, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Left kerb */}
      <mesh position={[-(ROAD_WIDTH / 2 + 0.2), 0.07, 0]}>
        <boxGeometry args={[0.4, 0.34, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Right kerb */}
      <mesh position={[ROAD_WIDTH / 2 + 0.2, 0.07, 0]}>
        <boxGeometry args={[0.4, 0.34, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Lane dividers */}
      <LaneDivider x={-2.5} />
      <LaneDivider x={2.5} />
    </>
  )
}

export default function Road() {
  const tile1 = useRef()
  const tile2 = useRef()

  useFrame((_, delta) => {
    const { phase, speed } = useGameStore.getState()
    if (phase !== 'playing') return
    const t1 = tile1.current
    const t2 = tile2.current
    if (!t1 || !t2) return

    const move = speed * delta
    t1.position.z += move
    t2.position.z += move

    // Recycle whichever tile fully passed the camera
    if (t1.position.z > RECYCLE_Z) t1.position.z = t2.position.z - TILE_LENGTH
    if (t2.position.z > RECYCLE_Z) t2.position.z = t1.position.z - TILE_LENGTH
  })

  return (
    <>
      <group ref={tile1} position={[0, 0, 0]}>
        <RoadGeometry />
      </group>
      <group ref={tile2} position={[0, 0, -TILE_LENGTH]}>
        <RoadGeometry />
      </group>
    </>
  )
}
