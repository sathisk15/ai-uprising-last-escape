import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import { LANES } from '../../game/zones'
import { aabbXZ, HALF } from '../../game/physics'
import { inputState } from '../../game/inputState'
import { droneSharedData } from '../enemies/droneData'
import { spawnExplosion } from './ExplosionPool'

const MAX_BULLETS  = 12
const BULLET_SPEED = 48   // units/s — travels toward negative Z
const PARK_Z       = -800
const DESPAWN_Z    = -80  // past fog — recycle
const FIRE_RATE    = 0.28 // seconds between shots

export default function BulletPool() {
  const slots = useRef(
    Array.from({ length: MAX_BULLETS }, (_, i) => ({
      id: i,
      active: false,
      x: 0,
      z: 0,
    }))
  )
  const refs     = useRef(Array.from({ length: MAX_BULLETS }, () => null))
  const fireTimer = useRef(0)

  useFrame((_, delta) => {
    const { phase, playerLane } = useGameStore.getState()
    if (phase !== 'playing') return

    fireTimer.current = Math.max(0, fireTimer.current - delta)

    // ── Fire ──────────────────────────────────────────────────────────────────
    if (inputState.shootPressed) {
      inputState.shootPressed = false
      if (fireTimer.current <= 0) {
        fireTimer.current = FIRE_RATE
        const slot = slots.current.find(s => !s.active)
        if (slot) {
          slot.active = true
          slot.x = LANES[playerLane]
          slot.z = 1.5   // just ahead of the car
          const ref = refs.current[slot.id]
          if (ref) ref.position.set(slot.x, 0.85, slot.z)
        }
      }
    }

    // ── Move + collide ────────────────────────────────────────────────────────
    slots.current.forEach((slot) => {
      if (!slot.active) return
      const ref = refs.current[slot.id]
      if (!ref) return

      slot.z -= BULLET_SPEED * delta
      ref.position.z = slot.z

      // Despawn past fog
      if (slot.z < DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      // Bullet vs drones
      const drones = droneSharedData.slots
      if (!drones) return
      for (const drone of drones) {
        if (!drone.active) continue
        if (aabbXZ(
          slot.x, slot.z, HALF.bullet.x, HALF.bullet.z,
          drone.x, drone.z, HALF.drone.x, HALF.drone.z
        )) {
          // Kill drone
          const droneRef = drone.groupRef ?? null
          spawnExplosion(drone.x, 1.6, drone.z)
          drone.active = false
          if (droneRef) droneRef.position.z = PARK_Z

          // Kill bullet
          slot.active = false
          ref.position.z = PARK_Z

          useGameStore.getState().addKill()
          break
        }
      }
    })
  })

  return (
    <>
      {Array.from({ length: MAX_BULLETS }).map((_, i) => (
        <group
          key={i}
          ref={el => { refs.current[i] = el }}
          position={[0, 0.85, PARK_Z]}
        >
          {/* Bullet body */}
          <mesh>
            <boxGeometry args={[0.08, 0.08, 0.5]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          {/* Glow trail */}
          <pointLight intensity={0.6} color="#00ffff" distance={2} />
        </group>
      ))}
    </>
  )
}
