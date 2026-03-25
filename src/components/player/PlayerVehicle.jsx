import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import usePlayerInput from './usePlayerInput'
import { LANES } from '../../game/zones'

// Wheel — cylinder lying on its side
function Wheel({ position }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.28, 0.28, 0.25, 14]} />
      <meshStandardMaterial color="#222222" roughness={0.9} metalness={0.1} />
    </mesh>
  )
}

function LightOrb({ position, color, intensity = 2 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.09, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    </mesh>
  )
}

const BASE_Y         = 0.5
const JUMP_HEIGHT    = 2.8
const JUMP_DURATION  = 0.75
const SLIDE_DURATION = 0.6

export default function PlayerVehicle() {
  const groupRef  = useRef()
  const jumpT     = useRef(0)
  const slideT    = useRef(0)

  usePlayerInput()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { phase, playerLane, isJumping, isSliding, endJump, endSlide } = useGameStore.getState()
    if (phase !== 'playing' && phase !== 'paused') return

    // ── Lane lerp ──────────────────────────────────────────────────────────
    const targetX = LANES[playerLane]
    const curX    = groupRef.current.position.x
    groupRef.current.position.x += (targetX - curX) * Math.min(delta * 9, 1)
    groupRef.current.rotation.z = -(targetX - curX) * 0.15

    // ── Jump arc ───────────────────────────────────────────────────────────
    if (isJumping) {
      jumpT.current = Math.min(jumpT.current + delta / JUMP_DURATION, 1)
      groupRef.current.position.y = BASE_Y + Math.sin(jumpT.current * Math.PI) * JUMP_HEIGHT
      groupRef.current.scale.y    = 1
      if (jumpT.current >= 1) {
        jumpT.current = 0
        groupRef.current.position.y = BASE_Y
        endJump()
      }
    // ── Slide squish ────────────────────────────────────────────────────────
    } else if (isSliding) {
      slideT.current = Math.min(slideT.current + delta / SLIDE_DURATION, 1)
      const squish = 1 - Math.sin(slideT.current * Math.PI) * 0.55
      groupRef.current.scale.y    = squish
      groupRef.current.position.y = BASE_Y - (1 - squish) * 0.35
      if (slideT.current >= 1) {
        slideT.current = 0
        groupRef.current.scale.y    = 1
        groupRef.current.position.y = BASE_Y
        endSlide()
      }
    } else {
      // Ensure reset when neither active
      groupRef.current.position.y = BASE_Y
      groupRef.current.scale.y    = 1
      jumpT.current  = 0
      slideT.current = 0
    }
  })

  // group y=0.5 → wheels sit just above road surface (road top = 0.1 world)
  return (
    <group ref={groupRef} position={[0, 0.5, 2]}>

      {/* Body */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.5, 2.5]} />
        <meshStandardMaterial color="#2e6ea6" metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Cabin */}
      <mesh castShadow position={[0, 0.52, -0.15]}>
        <boxGeometry args={[0.88, 0.38, 1.2]} />
        <meshStandardMaterial color="#1a4a70" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Hood */}
      <mesh castShadow position={[0, 0.24, 0.9]}>
        <boxGeometry args={[1.1, 0.12, 0.6]} />
        <meshStandardMaterial color="#255a8a" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, -0.06, 1.3]}>
        <boxGeometry args={[1.15, 0.2, 0.16]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rear spoiler */}
      <mesh position={[0, 0.44, -1.2]}>
        <boxGeometry args={[1.0, 0.08, 0.1]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── Wheels — y=-0.15 so bottom sits at 0.5-0.15-0.28=0.07 ≈ road level ── */}
      <Wheel position={[-0.66, -0.15,  0.85]} />
      <Wheel position={[ 0.66, -0.15,  0.85]} />
      <Wheel position={[-0.66, -0.15, -0.85]} />
      <Wheel position={[ 0.66, -0.15, -0.85]} />

      {/* Headlights */}
      <LightOrb position={[-0.35, 0.08, 1.26]} color="#ddeeff" intensity={2.5} />
      <LightOrb position={[ 0.35, 0.08, 1.26]} color="#ddeeff" intensity={2.5} />
      <pointLight position={[-0.35, 0.08, 2]} intensity={3} color="#ffffff" distance={12} decay={2} />
      <pointLight position={[ 0.35, 0.08, 2]} intensity={3} color="#ffffff" distance={12} decay={2} />

      {/* Tail lights */}
      <LightOrb position={[-0.42, 0.08, -1.26]} color="#ff1a1a" />
      <LightOrb position={[ 0.42, 0.08, -1.26]} color="#ff1a1a" />
    </group>
  )
}
