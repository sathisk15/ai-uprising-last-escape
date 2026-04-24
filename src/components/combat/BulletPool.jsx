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
  const refs        = useRef(Array.from({ length: MAX_BULLETS }, () => null))
  const fireTimer   = useRef(0)
  const muzzleRef   = useRef(null)
  const muzzleTimer = useRef(0)

  useFrame((_, delta) => {
    const { phase, playerLane } = useGameStore.getState()
    if (phase !== 'playing') return

    fireTimer.current = Math.max(0, fireTimer.current - delta)

    // Muzzle flash fade
    muzzleTimer.current = Math.max(0, muzzleTimer.current - delta)
    if (muzzleRef.current) {
      const m = muzzleTimer.current / 0.08
      muzzleRef.current.visible = muzzleTimer.current > 0
      if (muzzleRef.current.material)
        muzzleRef.current.material.opacity = m
      muzzleRef.current.scale.setScalar(0.5 + (1 - m) * 0.8)
    }

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
            // Trigger muzzle flash
            muzzleTimer.current = 0.08
            if (muzzleRef.current) {
              muzzleRef.current.position.set(LANES[playerLane], 0.85, 1.2)
            }
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
      {/* Muzzle flash — single shared mesh, shown briefly on fire */}
      <mesh ref={muzzleRef} visible={false} position={[0, 0.85, 1.2]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffaa00"
          emissiveIntensity={10} transparent opacity={1}
          toneMapped={false} depthWrite={false} />
      </mesh>

      {Array.from({ length: MAX_BULLETS }).map((_, i) => (
        <group key={i} ref={el => { refs.current[i] = el }} position={[0, 0.85, PARK_Z]}>
          {/* Tracer glow — warm orange halo */}
          <mesh>
            <boxGeometry args={[0.1, 0.06, 1.0]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} toneMapped={false} transparent opacity={0.3} depthWrite={false} />
          </mesh>
          {/* Core — bright white-hot needle */}
          <mesh>
            <boxGeometry args={[0.03, 0.03, 1.2]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffcc44" emissiveIntensity={10} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}
