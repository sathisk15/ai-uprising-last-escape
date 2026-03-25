import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import { LANES } from '../../game/zones'
import { aabbXZ, HALF } from '../../game/physics'
import { droneSharedData } from '../enemies/droneData'

const MAX_PROJ    = 10
const PROJ_SPEED  = 22   // units/s toward player (+Z)
const PARK_Z      = -800
const DESPAWN_Z   = 16   // past player — recycle
const MIN_FIRE    = 2.2  // seconds between shots per drone
const MAX_FIRE    = 4.5

export default function DroneProjectilePool() {
  const slots = useRef(
    Array.from({ length: MAX_PROJ }, (_, i) => ({
      id: i,
      active: false,
      x: 0,
      z: PARK_Z,
    }))
  )
  const refs = useRef(Array.from({ length: MAX_PROJ }, () => null))

  // Per-drone fire timers keyed by drone slot id (up to 6 drones)
  const droneFireTimers = useRef(
    Array.from({ length: 6 }, () => MIN_FIRE + Math.random() * (MAX_FIRE - MIN_FIRE))
  )

  // Separate cooldown so projectile hits don't block obstacle/drone hit window
  const hitCooldown = useRef(0)

  useFrame((_, delta) => {
    const { phase, zone, playerLane } = useGameStore.getState()
    if (phase !== 'playing' || zone < 2) return

    hitCooldown.current = Math.max(0, hitCooldown.current - delta)
    const playerX = LANES[playerLane]

    // ── Fire from each active drone ─────────────────────────────────────────
    const drones = droneSharedData.slots
    if (drones) {
      drones.forEach((drone, di) => {
        if (!drone.active) return

        droneFireTimers.current[di] -= delta
        if (droneFireTimers.current[di] > 0) return

        // Reset timer with jitter
        droneFireTimers.current[di] = MIN_FIRE + Math.random() * (MAX_FIRE - MIN_FIRE)

        // Aim at player lane
        const slot = slots.current.find(s => !s.active)
        if (!slot) return

        slot.active = true
        slot.x = drone.x            // fire from drone's current X
        slot.z = drone.z + 1.0      // slightly in front of drone body

        const ref = refs.current[slot.id]
        if (ref) ref.position.set(slot.x, 1.0, slot.z)
      })
    }

    // ── Move + collide ──────────────────────────────────────────────────────
    slots.current.forEach((slot) => {
      if (!slot.active) return
      const ref = refs.current[slot.id]
      if (!ref) return

      slot.z += PROJ_SPEED * delta
      ref.position.z = slot.z

      // Despawn past player
      if (slot.z > DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      // Collision with player
      if (hitCooldown.current > 0) return
      if (aabbXZ(
        slot.x, slot.z, HALF.bullet.x, HALF.bullet.z,
        playerX, 2, HALF.player.x, HALF.player.z
      )) {
        slot.active = false
        ref.position.z = PARK_Z
        useGameStore.getState().takeDamage('droneProjectile')
        hitCooldown.current = 0.6
      }
    })
  })

  return (
    <>
      {Array.from({ length: MAX_PROJ }).map((_, i) => (
        <group
          key={i}
          ref={el => { refs.current[i] = el }}
          position={[0, 1.0, PARK_Z]}
        >
          {/* Projectile bolt */}
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.55]} />
            <meshStandardMaterial
              color="#ff2200"
              emissive="#ff1100"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          {/* Glow */}
          <pointLight intensity={0.5} color="#ff2200" distance={2} />
        </group>
      ))}
    </>
  )
}
