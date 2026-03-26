import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import { LANES } from '../../game/zones'
import { aabbXZ, HALF } from '../../game/physics'
import { inputState } from '../../game/inputState'
import { droneSharedData } from '../enemies/droneData'
import { obstacleSharedData } from '../obstacles/obstacleData'
import { spawnExplosion } from './ExplosionPool'
import AudioManager from '../../audio/AudioManager'

const MAX_BULLETS  = 12
const BULLET_SPEED = 48
const PARK_Z       = -800
const DESPAWN_Z    = -80
const FIRE_RATE    = 0.28

// Obstacle half-extents for bullet collision (slightly smaller for fairness)
const OB_HX = { barricade: 0.85, energyWall: 0.7 }
const OB_HZ = { barricade: 0.35, energyWall: 0.12 }

export default function BulletPool() {
  const slots = useRef(
    Array.from({ length: MAX_BULLETS }, (_, i) => ({
      id: i, active: false, x: 0, z: 0,
    }))
  )
  const refs      = useRef(Array.from({ length: MAX_BULLETS }, () => null))
  const fireTimer = useRef(0)

  useFrame((_, delta) => {
    const { phase, playerLane } = useGameStore.getState()
    if (phase !== 'playing') return

    fireTimer.current = Math.max(0, fireTimer.current - delta)

    // ── Fire ──────────────────────────────────────────────────────────────────
    if (inputState.shootPressed) {
      inputState.shootPressed = false
      if (fireTimer.current <= 0) {
        const fired = useGameStore.getState().useAmmo()
        if (fired) {
          fireTimer.current = FIRE_RATE
          const slot = slots.current.find(s => !s.active)
          if (slot) {
            slot.active = true
            slot.x = LANES[playerLane]
            slot.z = 1.5
            const ref = refs.current[slot.id]
            if (ref) ref.position.set(slot.x, 0.85, slot.z)
            AudioManager.playSFX('shoot')
          }
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

      if (slot.z < DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      // ── Bullet vs drones ──────────────────────────────────────────────────
      const drones = droneSharedData.slots
      if (drones) {
        for (const drone of drones) {
          if (!drone.active) continue
          if (aabbXZ(
            slot.x, slot.z, HALF.bullet.x, HALF.bullet.z,
            drone.x, drone.z, HALF.drone.x, HALF.drone.z
          )) {
            spawnExplosion(drone.x, 1.6, drone.z)
            AudioManager.playSFX('explosion')
            drone.active = false
            if (drone.groupRef) drone.groupRef.position.z = PARK_Z

            slot.active = false
            ref.position.z = PARK_Z
            useGameStore.getState().addKill()
            return
          }
        }
      }

      // ── Bullet vs obstacles ───────────────────────────────────────────────
      const checkObstacles = (pool, hx, hz) => {
        if (!pool) return false
        for (const ob of pool) {
          if (!ob.active) continue
          if (aabbXZ(
            slot.x, slot.z, HALF.bullet.x, HALF.bullet.z,
            LANES[ob.lane], ob.z, hx, hz
          )) {
            ob.hp--
            if (ob.hp <= 0) {
              spawnExplosion(LANES[ob.lane], 0.6, ob.z)
              AudioManager.playSFX('explosion')
              ob.active = false
              if (ob.ref) ob.ref.position.z = PARK_Z
              useGameStore.getState().addScore(50)
            } else {
              // First hit — flash scale
              if (ob.ref) {
                ob.ref.scale.set(1.15, 1.15, 1.15)
                setTimeout(() => { if (ob.ref) ob.ref.scale.set(1, 1, 1) }, 80)
              }
              AudioManager.playSFX('hit')
            }
            slot.active = false
            ref.position.z = PARK_Z
            return true
          }
        }
        return false
      }

      if (checkObstacles(obstacleSharedData.barricadeSlots,  OB_HX.barricade,  OB_HZ.barricade))  return
      checkObstacles(obstacleSharedData.energyWallSlots, OB_HX.energyWall, OB_HZ.energyWall)
    })
  })

  return (
    <>
      {Array.from({ length: MAX_BULLETS }).map((_, i) => (
        <group key={i} ref={el => { refs.current[i] = el }} position={[0, 0.85, PARK_Z]}>
          <mesh>
            <boxGeometry args={[0.08, 0.08, 0.5]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={4} toneMapped={false} />
          </mesh>
          <pointLight intensity={0.8} color="#00ffff" distance={2.5} />
        </group>
      ))}
    </>
  )
}
