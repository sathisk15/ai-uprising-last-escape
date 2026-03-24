import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

const TILE_LENGTH = 60
const ROAD_WIDTH = 8
const RECYCLE_Z = 14        // tile center recycles when it crosses here
const RESET_OFFSET = -TILE_LENGTH * 2  // how far back it teleports

// Dashed lane divider segments along one tile
function LaneDivider({ x }) {
  const segLen = 2.4
  const gap = 2.6
  const step = segLen + gap
  const count = Math.floor(TILE_LENGTH / step)

  return (
    <group position={[x, 0.11, -TILE_LENGTH / 2 + segLen / 2]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0, i * step]}>
          <boxGeometry args={[0.08, 0.02, segLen]} />
          <meshStandardMaterial color="#cccc00" emissive="#666600" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// Road tile geometry — reused for both tiles
function RoadGeometry() {
  return (
    <>
      {/* Surface */}
      <mesh receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.2, TILE_LENGTH]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Left kerb */}
      <mesh position={[-(ROAD_WIDTH / 2 + 0.2), 0.06, 0]}>
        <boxGeometry args={[0.4, 0.32, TILE_LENGTH]} />
        <meshStandardMaterial color="#252525" />
      </mesh>
      {/* Right kerb */}
      <mesh position={[ROAD_WIDTH / 2 + 0.2, 0.06, 0]}>
        <boxGeometry args={[0.4, 0.32, TILE_LENGTH]} />
        <meshStandardMaterial color="#252525" />
      </mesh>
      {/* Lane dividers */}
      <LaneDivider x={-2.5} />
      <LaneDivider x={2.5} />
      {/* Faint center line */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.06, 0.02, TILE_LENGTH]} />
        <meshStandardMaterial color="#ffffff" opacity={0.12} transparent />
      </mesh>
    </>
  )
}

export default function Road() {
  const tile1 = useRef()
  const tile2 = useRef()

  const phase = useGameStore((s) => s.phase)
  const speed = useGameStore((s) => s.speed)

  useFrame((_, delta) => {
    if (phase !== 'playing') return
    const t1 = tile1.current
    const t2 = tile2.current
    if (!t1 || !t2) return

    const move = speed * delta
    t1.position.z += move
    t2.position.z += move

    // Recycle: whichever tile goes past camera, snap behind the other
    if (t1.position.z > RECYCLE_Z) {
      t1.position.z = t2.position.z - TILE_LENGTH
    }
    if (t2.position.z > RECYCLE_Z) {
      t2.position.z = t1.position.z - TILE_LENGTH
    }
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
