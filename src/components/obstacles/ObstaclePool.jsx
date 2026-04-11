import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import { LANES, ZONES } from '../../game/zones'
import { aabbXZ, HALF } from '../../game/physics'
import Barricade from './Barricade'
import EnergyWall from './EnergyWall'
import AudioManager from '../../audio/AudioManager'
import { obstacleSharedData } from './obstacleData'

const MAX_BARRICADES  = 7
const MAX_ENERGYWALLS = 4
const SPAWN_Z   = -68
const PARK_Z    = -500
const DESPAWN_Z = 18

// ─── Barricade pool ───────────────────────────────────────────────────────────
function BarricadePool({ spawnTimer, hitCooldown }) {
  const data = useRef(
    Array.from({ length: MAX_BARRICADES }, (_, i) => ({
      id: i, active: false, lane: 1, z: PARK_Z, hp: 2, ref: null, type: 'barricade',
    }))
  )

  // Register once — BulletPool reads this array
  obstacleSharedData.barricadeSlots = data.current

  useFrame((_, delta) => {
    const { phase, speed, zone, distance, playerLane } = useGameStore.getState()
    if (phase !== 'playing') {
      // Clear all barricades when zoneout starts
      if (phase === 'zoneout') {
        data.current.forEach((slot) => {
          if (slot.active) {
            slot.active = false
            if (slot.ref) slot.ref.position.z = PARK_Z
            slot.z = PARK_Z
          }
        })
      }
      return
    }

    const playerX = LANES[playerLane]

    data.current.forEach((slot) => {
      if (!slot.active) return
      const ref = slot.ref
      if (!ref) return

      slot.z += speed * delta
      ref.position.z = slot.z

      if (slot.z > DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      // Collision — jump clears barricades
      if (hitCooldown.current > 0) return
      if (!useGameStore.getState().isJumping && aabbXZ(
        LANES[slot.lane], slot.z, HALF.barricade.x, HALF.barricade.z,
        playerX, 2, HALF.player.x, HALF.player.z
      )) {
        slot.active = false
        ref.position.z = PARK_Z
        useGameStore.getState().takeDamage('obstacle')
        AudioManager.playSFX('hit')
        hitCooldown.current = 1.5
      }
    })

    // Spawn — stop 120 units before zone end so the road clears before zoneout
    spawnTimer.barricade -= delta
    const nearEnd = ZONES[zone].distanceThreshold - distance < 120
    if (spawnTimer.barricade <= 0 && !nearEnd) {
      const zoneData = ZONES[zone]
      spawnTimer.barricade = zoneData.obstacleRate + (Math.random() - 0.5) * 0.8

      const slot = data.current.find(s => !s.active)
      if (slot) {
        slot.active = true
        slot.lane   = Math.floor(Math.random() * 3)
        slot.z      = SPAWN_Z
        slot.hp     = 2
        if (slot.ref) {
          slot.ref.position.x = LANES[slot.lane]
          slot.ref.position.z = SPAWN_Z
          slot.ref.scale.set(1, 1, 1)
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_BARRICADES }).map((_, i) => (
        <group
          key={i}
          ref={el => { data.current[i].ref = el }}
          position={[LANES[1], 0, PARK_Z]}
        >
          <Barricade />
        </group>
      ))}
    </>
  )
}

// ─── Energy wall pool (Zone 2+) ───────────────────────────────────────────────
function EnergyWallPool({ spawnTimer, hitCooldown }) {
  const data = useRef(
    Array.from({ length: MAX_ENERGYWALLS }, (_, i) => ({
      id: i + MAX_BARRICADES, active: false, lane: 1, z: PARK_Z, hp: 1, ref: null, type: 'energyWall',
    }))
  )

  obstacleSharedData.energyWallSlots = data.current

  useFrame((_, delta) => {
    const { phase, speed, zone, distance, playerLane } = useGameStore.getState()
    if (phase !== 'playing' || zone < 2) {
      if (phase === 'zoneout') {
        data.current.forEach((slot) => {
          if (slot.active) {
            slot.active = false
            if (slot.ref) slot.ref.position.z = PARK_Z
            slot.z = PARK_Z
          }
        })
      }
      return
    }

    const playerX = LANES[playerLane]

    data.current.forEach((slot) => {
      if (!slot.active) return
      const ref = slot.ref
      if (!ref) return

      slot.z += speed * delta
      ref.position.z = slot.z

      if (slot.z > DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      if (hitCooldown.current > 0) return
      if (aabbXZ(
        LANES[slot.lane], slot.z, HALF.energyWall.x, HALF.energyWall.z,
        playerX, 2, HALF.player.x, HALF.player.z
      )) {
        slot.active = false
        ref.position.z = PARK_Z
        useGameStore.getState().takeDamage('obstacle')
        AudioManager.playSFX('hit')
        hitCooldown.current = 1.5
      }
    })

    spawnTimer.energyWall -= delta
    const nearEnd = ZONES[zone].distanceThreshold - distance < 120
    if (spawnTimer.energyWall <= 0 && !nearEnd) {
      const zoneData = ZONES[zone]
      spawnTimer.energyWall = zoneData.obstacleRate * 1.8 + Math.random()

      const slot = data.current.find(s => !s.active)
      if (slot) {
        slot.active = true
        slot.lane   = Math.floor(Math.random() * 3)
        slot.z      = SPAWN_Z
        slot.hp     = 1
        if (slot.ref) {
          slot.ref.position.x = LANES[slot.lane]
          slot.ref.position.z = SPAWN_Z
          slot.ref.scale.set(1, 1, 1)
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_ENERGYWALLS }).map((_, i) => (
        <group
          key={i}
          ref={el => { data.current[i].ref = el }}
          position={[LANES[1], 0, PARK_Z]}
        >
          <EnergyWall />
        </group>
      ))}
    </>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function ObstaclePool({ hitCooldown }) {
  const spawnTimer = useRef({ barricade: 2.0, energyWall: 4.0 })

  return (
    <>
      <BarricadePool spawnTimer={spawnTimer.current} hitCooldown={hitCooldown} />
      <EnergyWallPool spawnTimer={spawnTimer.current} hitCooldown={hitCooldown} />
    </>
  )
}
