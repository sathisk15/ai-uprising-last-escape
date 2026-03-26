import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import useGameStore from '../../store/gameStore'
import AudioManager from '../../audio/AudioManager'
import { LANES } from '../../game/zones'
import { aabbXZ } from '../../game/physics'

const MAX        = 10
const SPAWN_Z    = -65
const PARK_Z     = -800
const DESPAWN_Z  = 18
const SPAWN_RATE = 4.5
const BOB_AMP    = 0.18
const BOB_FREQ   = 2.0

const P = { x: 0.55, z: 1.1 }
const C = { x: 0.5,  z: 0.5 }

function randomType() {
  const r = Math.random()
  if (r < 0.4) return 'energy'
  if (r < 0.7) return 'repair'
  return 'chip'
}

const REWARDS = {
  energy: () => useGameStore.getState().refillEnergy(30),
  repair: () => useGameStore.getState().repairHealth(25),
  chip:   () => useGameStore.getState().addScore(150),
}

// ── Visuals ───────────────────────────────────────────────────────────────────
function EnergyCell() {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#0088ff" emissive="#0044ff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.38, 0.04, 8, 24]} />
        <meshStandardMaterial color="#44aaff" emissive="#2266ff" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <pointLight intensity={0.8} color="#0088ff" distance={3} />
    </group>
  )
}

function RepairPack() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.14, 0.14]} />
        <meshStandardMaterial color="#00cc44" emissive="#007722" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#00cc44" emissive="#007722" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.38, 0.38, 0.1]} />
        <meshStandardMaterial color="#004422" metalness={0.5} roughness={0.4} />
      </mesh>
      <pointLight intensity={0.8} color="#00cc44" distance={3} />
    </group>
  )
}

function DataChip() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.08, 0.38]} />
        <meshStandardMaterial color="#00ffee" emissive="#009988" emissiveIntensity={2} toneMapped={false} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.3, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.05, 0.1]}>
        <boxGeometry args={[0.16, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <pointLight intensity={0.8} color="#00ffee" distance={3} />
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
      outerRef:  null,  // position / scale
      innerRef:  null,  // bob + spin
      energyRef: null,  // visibility toggle
      repairRef: null,
      chipRef:   null,
    }))
  )
  const spawnTimer = useRef(2.0)

  useFrame((_, delta) => {
    const { phase, speed, playerLane } = useGameStore.getState()
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

      // Bob + spin
      if (inner) {
        inner.position.y = Math.sin(t * BOB_FREQ + slot.id) * BOB_AMP
        inner.rotation.y += delta * 1.8
      }

      // Despawn
      if (slot.z > DESPAWN_Z) {
        slot.active = false
        outer.position.z = PARK_Z
        return
      }

      // Pickup
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

    // Spawn
    spawnTimer.current -= delta
    if (spawnTimer.current <= 0) {
      spawnTimer.current = SPAWN_RATE + (Math.random() - 0.5) * 2.0

      const slot = slots.current.find(s => !s.active)
      if (slot) {
        slot.active = true
        slot.type   = randomType()
        slot.lane   = Math.floor(Math.random() * 3)
        slot.z      = SPAWN_Z

        // Toggle visibility for the correct type
        if (slot.energyRef) slot.energyRef.visible = slot.type === 'energy'
        if (slot.repairRef) slot.repairRef.visible = slot.type === 'repair'
        if (slot.chipRef)   slot.chipRef.visible   = slot.type === 'chip'

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
        <group
          key={slot.id}
          ref={el => { slot.outerRef = el }}
          position={[LANES[1], 0.85, PARK_Z]}
        >
          <group ref={el => { slot.innerRef = el }}>
            {/* All 3 types always mounted — visibility toggled via refs */}
            <group ref={el => { slot.energyRef = el }} visible={false}>
              <EnergyCell />
            </group>
            <group ref={el => { slot.repairRef = el }} visible={false}>
              <RepairPack />
            </group>
            <group ref={el => { slot.chipRef = el }} visible={false}>
              <DataChip />
            </group>
          </group>
        </group>
      ))}
    </>
  )
}
