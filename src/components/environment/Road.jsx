import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

const TILE_LENGTH = 64
const ROAD_WIDTH  = 8
const RECYCLE_Z   = 50

const isMobile = typeof window !== 'undefined' &&
  (/Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768)

// Dashed lane divider — solid stripe on mobile (1 draw call), dashes on desktop (7 draw calls)
function LaneDivider({ x }) {
  if (isMobile) {
    return (
      <mesh position={[x, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.012, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#ddcc00" emissive="#998800" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    )
  }
  const segLen = 2.4
  const gap    = 4.0
  const step   = segLen + gap
  const count  = 7   // fixed count — enough to cover tile, was 14 before

  return (
    <group position={[x, 0.12, -TILE_LENGTH / 2 + segLen / 2]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0, i * step]}>
          <boxGeometry args={[0.07, 0.015, segLen]} />
          <meshStandardMaterial color="#ddcc00" emissive="#998800" emissiveIntensity={1.0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// Solid center line (white)
function CenterLine() {
  return (
    <mesh position={[0, 0.115, 0]}>
      <boxGeometry args={[0.06, 0.01, TILE_LENGTH + 2]} />
      <meshStandardMaterial color="#ffffff" emissive="#888888" emissiveIntensity={0.4} />
    </mesh>
  )
}

// Kerb edge with emissive strip
function Kerb({ x }) {
  const sign = x > 0 ? 1 : -1
  return (
    <group position={[x, 0.07, 0]}>
      {/* Kerb block */}
      <mesh>
        <boxGeometry args={[0.4, 0.34, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#252525" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Top emissive strip */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.38, 0.02, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  )
}

function RoadGeometry() {
  return (
    <>
      {/* Surface — slightly reflective for wet-road look */}
      <mesh receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.2, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#141414" roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Subtle wet sheen overlay (desktop only — transparent overdraw is expensive on mobile) */}
      {!isMobile && (
        <mesh position={[0, 0.102, 0]}>
          <boxGeometry args={[ROAD_WIDTH - 0.2, 0.001, TILE_LENGTH + 2]} />
          <meshStandardMaterial color="#223355" metalness={0.9} roughness={0.05} opacity={0.18} transparent />
        </mesh>
      )}
      <CenterLine />
      <LaneDivider x={-2.5} />
      <LaneDivider x={ 2.5} />
      <Kerb x={-(ROAD_WIDTH / 2 + 0.2)} />
      <Kerb x={ ROAD_WIDTH / 2 + 0.2} />
    </>
  )
}

export default function Road() {
  const tile1 = useRef()
  const tile2 = useRef()

  useFrame((_, delta) => {
    const { phase, speed } = useGameStore.getState()
    if (phase !== 'playing' && phase !== 'dying' && phase !== 'zoneout') return
    const t1 = tile1.current
    const t2 = tile2.current
    if (!t1 || !t2) return

    const move = speed * delta
    t1.position.z += move
    t2.position.z += move

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
