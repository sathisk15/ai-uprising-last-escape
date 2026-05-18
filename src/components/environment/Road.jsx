import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

const TILE_LENGTH = 160
const ROAD_WIDTH  = 8
const RECYCLE_Z   = 80

function LaneDivider({ x, reducedGfx }) {
  const segLen = 3.0
  const gap    = 5.0
  const step   = segLen + gap
  const count  = reducedGfx ? 12 : 22

  return (
    <group position={[x, 0.121, -TILE_LENGTH / 2 + segLen / 2]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0, i * step]}>
          <boxGeometry args={[0.08, 0.01, segLen]} />
          <meshStandardMaterial color="#e8e8e8" emissive="#aaaaaa" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Double solid yellow center line — like a real road
function CenterLine() {
  return (
    <>
      <mesh position={[-0.06, 0.121, 0]}>
        <boxGeometry args={[0.05, 0.01, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#c8a800" emissive="#000000" emissiveIntensity={0} roughness={0.9} />
      </mesh>
      <mesh position={[0.06, 0.121, 0]}>
        <boxGeometry args={[0.05, 0.01, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#c8a800" emissive="#000000" emissiveIntensity={0} roughness={0.9} />
      </mesh>
    </>
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
      {/* Top edge strip — dim white, no glow */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.38, 0.02, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#444444" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  )
}

function RoadGeometry({ reducedGfx }) {
  return (
    <>
      <mesh receiveShadow={!reducedGfx}>
        <boxGeometry args={[ROAD_WIDTH, 0.2, TILE_LENGTH + 2]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.75} metalness={0.15} />
      </mesh>
      {!reducedGfx && (
        <mesh position={[0, 0.102, 0]}>
          <boxGeometry args={[ROAD_WIDTH - 0.2, 0.001, TILE_LENGTH + 2]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.95} roughness={0.05} opacity={0.12} transparent />
        </mesh>
      )}
      <CenterLine />
      <LaneDivider x={-2.5} reducedGfx={reducedGfx} />
      <LaneDivider x={ 2.5} reducedGfx={reducedGfx} />
      <Kerb x={-(ROAD_WIDTH / 2 + 0.2)} />
      <Kerb x={ ROAD_WIDTH / 2 + 0.2} />
    </>
  )
}

export default function Road({ reducedGfx = false }) {
  const tile1 = useRef()
  const tile2 = useRef()
  const tile3 = useRef()

  useFrame((_, delta) => {
    const { phase, speed, tutorialFrozen } = useGameStore.getState()
    if (phase !== 'playing' && phase !== 'dying' && phase !== 'zoneout') return
    if (tutorialFrozen) return
    const t1 = tile1.current
    const t2 = tile2.current
    const t3 = tile3.current
    if (!t1 || !t2 || !t3) return

    const move = speed * delta
    t1.position.z += move
    t2.position.z += move
    t3.position.z += move

    // Recycle: snapshot z, find baseZ (rearmost), place each recycler sequentially behind it
    const tiles = [t1, t2, t3]
    const zs = tiles.map(t => t.position.z)
    const baseZ = Math.min(...zs)
    const recyclers = zs
      .map((z, i) => ({ tile: tiles[i], z }))
      .filter(e => e.z > RECYCLE_Z)
      .sort((a, b) => b.z - a.z)
    recyclers.forEach((entry, i) => {
      entry.tile.position.z = baseZ - TILE_LENGTH * (i + 1)
    })
  })

  return (
    <>
      <group ref={tile1} position={[0, 0, 0]}>
        <RoadGeometry reducedGfx={reducedGfx} />
      </group>
      <group ref={tile2} position={[0, 0, -TILE_LENGTH]}>
        <RoadGeometry reducedGfx={reducedGfx} />
      </group>
      <group ref={tile3} position={[0, 0, -TILE_LENGTH * 2]}>
        <RoadGeometry reducedGfx={reducedGfx} />
      </group>
    </>
  )
}
