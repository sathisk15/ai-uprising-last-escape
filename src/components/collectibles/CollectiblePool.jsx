import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import useGameStore from '../../store/gameStore'
import { LANES, ZONES } from '../../game/zones'
import { aabbXZ } from '../../game/physics'
import AudioManager from '../../audio/AudioManager'

const MAX        = 12
const SPAWN_Z    = -65
const PARK_Z     = -800
const DESPAWN_Z  = 18
const SPAWN_RATE = 3.8
const BOB_AMP    = 0.18
const BOB_FREQ   = 2.0

const P = { x: 0.55, z: 1.1 }
const C = { x: 0.5,  z: 0.5 }

function randomType() {
  const r = Math.random()
  if (r < 0.27) return 'energy'
  if (r < 0.47) return 'repair'
  if (r < 0.61) return 'chip'
  if (r < 0.75) return 'ammo'
  if (r < 0.88) return 'shield'
  return 'boost'
}

const REWARDS = {
  energy: () => useGameStore.getState().refillEnergy(30),
  repair: () => useGameStore.getState().repairHealth(25),
  chip:   () => useGameStore.getState().addScore(150),
  ammo:   () => useGameStore.getState().refillAmmo(8),
  shield: () => useGameStore.getState().activateShield(),
  boost:  () => useGameStore.getState().activateSpeedBoost(6),
}

// ── Visuals ───────────────────────────────────────────────────────────────────
function EnergyCell() {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#0088ff" emissive="#0066ff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.42, 0.045, 6, 20]} />
        <meshStandardMaterial color="#44bbff" emissive="#2277ff" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

function RepairPack() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.14, 0.14]} />
        <meshStandardMaterial color="#00dd44" emissive="#008822" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#00dd44" emissive="#008822" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.42, 0.42, 0.12]} />
        <meshStandardMaterial color="#003a18" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

function DataChip() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.09, 0.38]} />
        <meshStandardMaterial color="#00ffee" emissive="#009988" emissiveIntensity={2} toneMapped={false} metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.3, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.06, 0.1]}>
        <boxGeometry args={[0.16, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  )
}

function AmmoCrate() {
  return (
    <group>
      {/* Crate body */}
      <mesh castShadow>
        <boxGeometry args={[0.44, 0.3, 0.34]} />
        <meshStandardMaterial color="#886600" emissive="#553300" emissiveIntensity={0.8} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Cross strap H */}
      <mesh position={[0, 0.16, 0.18]}>
        <boxGeometry args={[0.42, 0.04, 0.01]} />
        <meshStandardMaterial color="#ffdd00" emissive="#cc8800" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      {/* Cross strap V */}
      <mesh position={[0, 0.16, 0.18]}>
        <boxGeometry args={[0.04, 0.3, 0.01]} />
        <meshStandardMaterial color="#ffdd00" emissive="#cc8800" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      {/* Bullet silhouettes (decorative) */}
      {[-0.12, 0, 0.12].map((bx, i) => (
        <mesh key={i} position={[bx, 0.28, 0]}>
          <cylinderGeometry args={[0.03, 0.035, 0.18, 6]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ff9900" emissiveIntensity={1} toneMapped={false} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function BoostPack() {
  // Two stacked forward-pointing chevrons (>> shape) = speed
  const chevron = (zOff, scale) => (
    <group position={[0, 0, zOff]} scale={scale}>
      {/* Left arm */}
      <mesh rotation={[0, 0, Math.PI * 0.22]} position={[-0.13, 0.1, 0]}>
        <boxGeometry args={[0.08, 0.28, 0.1]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      {/* Right arm */}
      <mesh rotation={[0, 0, -Math.PI * 0.22]} position={[0.13, 0.1, 0]}>
        <boxGeometry args={[0.08, 0.28, 0.1]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  )
  return (
    <group>
      {chevron(-0.14, 0.9)}
      {chevron( 0.14, 1.0)}
      {/* Glow core */}
      <mesh>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={2} transparent opacity={0.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

function ShieldOrb() {
  return (
    <group>
      {/* Core gem — octahedron, icy white-cyan */}
      <mesh castShadow>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#ddf6ff" emissive="#80d8ff" emissiveIntensity={3}
          toneMapped={false} metalness={0.5} roughness={0.05} />
      </mesh>
      {/* Ring — horizontal */}
      <mesh>
        <torusGeometry args={[0.42, 0.022, 6, 28]} />
        <meshStandardMaterial color="#ffffff" emissive="#a8e8ff" emissiveIntensity={2.5}
          transparent opacity={0.85} toneMapped={false} />
      </mesh>
      {/* Ring — vertical */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.022, 6, 28]} />
        <meshStandardMaterial color="#ffffff" emissive="#a8e8ff" emissiveIntensity={2.5}
          transparent opacity={0.85} toneMapped={false} />
      </mesh>
      {/* Outer translucent glass bubble */}
      <mesh>
        <sphereGeometry args={[0.52, 14, 14]} />
        <meshStandardMaterial color="#c8f4ff" emissive="#60c8ff" emissiveIntensity={0.3}
          transparent opacity={0.07} toneMapped={false} side={2} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── Pool ──────────────────────────────────────────────────────────────────────
export default function CollectiblePool() {
  const slots = useRef(
    Array.from({ length: MAX }, (_, i) => ({
      id: i,
      active: false,
      type: 'energy',
      lane: 1,
      z: PARK_Z,
      outerRef:  null,
      innerRef:  null,
      energyRef: null,
      repairRef: null,
      chipRef:   null,
      ammoRef:   null,
      shieldRef: null,
      boostRef:  null,
    }))
  )
  const spawnTimer = useRef(1.5)

  useFrame((_, delta) => {
    const { phase, speed, zone, distance, playerLane } = useGameStore.getState()
    if (phase !== 'playing') return

    const playerX = LANES[playerLane]
    const t       = performance.now() / 1000

    slots.current.forEach((slot) => {
      if (!slot.active) return
      const outer = slot.outerRef
      const inner = slot.innerRef
      if (!outer) return

      slot.z += speed * delta
      outer.position.z = slot.z

      if (inner) {
        inner.position.y = Math.sin(t * BOB_FREQ + slot.id) * BOB_AMP
        inner.rotation.y += delta * 1.8
      }

      if (slot.z > DESPAWN_Z) {
        slot.active = false
        outer.position.z = PARK_Z
        return
      }

      if (aabbXZ(LANES[slot.lane], slot.z, C.x, C.z, playerX, 2, P.x, P.z)) {
        slot.active = false
        REWARDS[slot.type]()
        AudioManager.playSFX('pickup')

        gsap.to(outer.scale, {
          x: 2.5, y: 2.5, z: 2.5,
          duration: 0.18,
          ease: 'power2.out',
          onComplete: () => {
            outer.position.z = PARK_Z
            outer.scale.set(1, 1, 1)
          },
        })
      }
    })

    // Spawn — stop 120 units before zone end so road clears before zoneout
    const nearEnd = ZONES[zone].distanceThreshold - distance < 120
    spawnTimer.current -= delta
    if (spawnTimer.current <= 0 && !nearEnd) {
      spawnTimer.current = SPAWN_RATE + (Math.random() - 0.5) * 1.6

      const slot = slots.current.find(s => !s.active)
      if (slot) {
        slot.active = true
        slot.type   = randomType()
        slot.lane   = Math.floor(Math.random() * 3)
        slot.z      = SPAWN_Z

        if (slot.energyRef)  slot.energyRef.visible  = slot.type === 'energy'
        if (slot.repairRef)  slot.repairRef.visible  = slot.type === 'repair'
        if (slot.chipRef)    slot.chipRef.visible    = slot.type === 'chip'
        if (slot.ammoRef)    slot.ammoRef.visible    = slot.type === 'ammo'
        if (slot.shieldRef)  slot.shieldRef.visible  = slot.type === 'shield'
        if (slot.boostRef)   slot.boostRef.visible   = slot.type === 'boost'

        if (slot.outerRef) {
          slot.outerRef.position.set(LANES[slot.lane], 0.85, SPAWN_Z)
          slot.outerRef.scale.set(1, 1, 1)
        }
      }
    }
  })

  return (
    <>
      {slots.current.map((slot) => (
        <group key={slot.id} ref={el => { slot.outerRef = el }} position={[LANES[1], 0.85, PARK_Z]}>
          <group ref={el => { slot.innerRef = el }}>
            <group ref={el => { slot.energyRef = el }} visible={false}><EnergyCell /></group>
            <group ref={el => { slot.repairRef = el }} visible={false}><RepairPack /></group>
            <group ref={el => { slot.chipRef   = el }} visible={false}><DataChip /></group>
            <group ref={el => { slot.ammoRef   = el }} visible={false}><AmmoCrate /></group>
            <group ref={el => { slot.shieldRef = el }} visible={false}><ShieldOrb /></group>
            <group ref={el => { slot.boostRef  = el }} visible={false}><BoostPack /></group>
          </group>
        </group>
      ))}
    </>
  )
}
