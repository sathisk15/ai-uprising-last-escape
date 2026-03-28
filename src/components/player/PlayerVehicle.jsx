import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import usePlayerInput from './usePlayerInput'
import { LANES } from '../../game/zones'

function Wheel({ position }) {
  return (
    <group position={position}>
      {/* Tyre */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 8]} />
        <meshStandardMaterial color="#555566" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Hub glow */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.29, 6]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}

const BASE_Y         = 0.5
const JUMP_HEIGHT    = 2.8
const JUMP_DURATION  = 0.75
const SLIDE_DURATION = 0.6

export default function PlayerVehicle() {
  const groupRef    = useRef()
  const jumpT       = useRef(0)
  const slideT      = useRef(0)
  const shieldRef   = useRef()
  const exhaustRef  = useRef()

  usePlayerInput()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { phase, playerLane, isJumping, isSliding, endJump, endSlide, shieldActive, speedBoostActive } = useGameStore.getState()
    if (phase !== 'playing' && phase !== 'paused') return

    // Lane lerp + tilt
    const targetX = LANES[playerLane]
    const curX    = groupRef.current.position.x
    groupRef.current.position.x += (targetX - curX) * Math.min(delta * 9, 1)
    groupRef.current.rotation.z  = -(targetX - curX) * 0.15

    // Jump arc
    if (isJumping) {
      jumpT.current = Math.min(jumpT.current + delta / JUMP_DURATION, 1)
      groupRef.current.position.y = BASE_Y + Math.sin(jumpT.current * Math.PI) * JUMP_HEIGHT
      groupRef.current.scale.y    = 1
      if (jumpT.current >= 1) { jumpT.current = 0; groupRef.current.position.y = BASE_Y; endJump() }
    // Slide squish
    } else if (isSliding) {
      slideT.current = Math.min(slideT.current + delta / SLIDE_DURATION, 1)
      const squish = 1 - Math.sin(slideT.current * Math.PI) * 0.55
      groupRef.current.scale.y    = squish
      groupRef.current.position.y = BASE_Y - (1 - squish) * 0.35
      if (slideT.current >= 1) { slideT.current = 0; groupRef.current.scale.y = 1; groupRef.current.position.y = BASE_Y; endSlide() }
    } else {
      groupRef.current.position.y = BASE_Y
      groupRef.current.scale.y    = 1
      jumpT.current = 0
      slideT.current = 0
    }

    // Boost exhaust flame visibility + flicker
    if (exhaustRef.current) {
      exhaustRef.current.visible = speedBoostActive
      if (speedBoostActive) {
        const flicker = 0.7 + Math.random() * 0.6
        exhaustRef.current.scale.z = flicker
      }
    }

    // Shield bubble visibility + pulse
    if (shieldRef.current) {
      shieldRef.current.visible = shieldActive
      if (shieldActive) {
        const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.06
        shieldRef.current.scale.setScalar(pulse)
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.5, 2]}>

      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.5, 2.5]} />
        <meshStandardMaterial color="#1a3d6e" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Side neon stripes */}
      <mesh position={[-0.61, 0.08, 0]}>
        <boxGeometry args={[0.01, 0.06, 2.2]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.61, 0.08, 0]}>
        <boxGeometry args={[0.01, 0.06, 2.2]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* ── Cabin ──────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.52, -0.15]}>
        <boxGeometry args={[0.88, 0.38, 1.2]} />
        <meshStandardMaterial color="#0f2a4a" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Windshield tint */}
      <mesh position={[0, 0.54, 0.46]}>
        <boxGeometry args={[0.82, 0.3, 0.04]} />
        <meshStandardMaterial color="#001a33" metalness={0.1} roughness={0.1} opacity={0.85} transparent />
      </mesh>

      {/* ── Hood ───────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.24, 0.9]}>
        <boxGeometry args={[1.1, 0.12, 0.6]} />
        <meshStandardMaterial color="#1a3d6e" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Front bumper ───────────────────────────────────────────────────── */}
      <mesh position={[0, -0.06, 1.3]}>
        <boxGeometry args={[1.15, 0.2, 0.16]} />
        <meshStandardMaterial color="#0a1520" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bumper accent bar */}
      <mesh position={[0, 0.02, 1.39]}>
        <boxGeometry args={[0.9, 0.04, 0.02]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* ── Rear spoiler ───────────────────────────────────────────────────── */}
      <mesh position={[0, 0.52, -1.18]}>
        <boxGeometry args={[1.05, 0.07, 0.08]} />
        <meshStandardMaterial color="#0a1520" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* ── Exhaust pipes ──────────────────────────────────────────────────── */}
      <mesh position={[-0.3, -0.12, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.18, 8]} />
        <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.3, -0.12, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.18, 8]} />
        <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* ── Wheels ──────────────────────────────────────────────────────────── */}
      <Wheel position={[-0.66, -0.15,  0.85]} />
      <Wheel position={[ 0.66, -0.15,  0.85]} />
      <Wheel position={[-0.66, -0.15, -0.85]} />
      <Wheel position={[ 0.66, -0.15, -0.85]} />

      {/* ── Headlights ──────────────────────────────────────────────────────── */}
      <mesh position={[-0.35, 0.1, 1.27]}>
        <boxGeometry args={[0.22, 0.1, 0.03]} />
        <meshStandardMaterial color="#ddeeff" emissive="#aaddff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[ 0.35, 0.1, 1.27]}>
        <boxGeometry args={[0.22, 0.1, 0.03]} />
        <meshStandardMaterial color="#ddeeff" emissive="#aaddff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.1, 2.4]} intensity={2.5} color="#cce8ff" distance={12} decay={2} />

      {/* ── Tail lights ─────────────────────────────────────────────────────── */}
      <mesh position={[-0.42, 0.1, -1.27]}>
        <boxGeometry args={[0.18, 0.08, 0.03]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff0000" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[ 0.42, 0.1, -1.27]}>
        <boxGeometry args={[0.18, 0.08, 0.03]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff0000" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* ── Boost exhaust flames (visible only when speedBoostActive) ───────── */}
      <group ref={exhaustRef} visible={false}>
        {/* Left exhaust flame */}
        <mesh position={[-0.3, -0.12, -1.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.55, 6]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={4} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        {/* Right exhaust flame */}
        <mesh position={[0.3, -0.12, -1.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.55, 6]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={4} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        {/* Inner white-hot core */}
        <mesh position={[-0.3, -0.12, -1.52]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffcc44" emissiveIntensity={5} toneMapped={false} />
        </mesh>
        <mesh position={[0.3, -0.12, -1.52]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffcc44" emissiveIntensity={5} toneMapped={false} />
        </mesh>
      </group>

      {/* ── Shield bubble (visible only when shieldActive) ────────────────── */}
      <group ref={shieldRef} visible={false} position={[0, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshStandardMaterial
            color="#cc44ff"
            emissive="#aa00ff"
            emissiveIntensity={1.2}
            transparent
            opacity={0.18}
            toneMapped={false}
            side={2}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.6, 0.035, 8, 40]} />
          <meshStandardMaterial color="#ee88ff" emissive="#cc00ff" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.035, 8, 40]} />
          <meshStandardMaterial color="#ee88ff" emissive="#cc00ff" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>

    </group>
  )
}
