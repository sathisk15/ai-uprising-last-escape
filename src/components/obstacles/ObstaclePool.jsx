import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import { LANES, ZONES } from '../../game/zones'
import { aabbXZ, HALF } from '../../game/physics'
import Barricade from './Barricade'
import EnergyWall from './EnergyWall'

const MAX_BARRICADES = 7
const MAX_ENERGYWALLS = 4
const SPAWN_Z = -68
const PARK_Z = -500          // where inactive obstacles sit (off screen)
const DESPAWN_Z = 18         // past camera → recycle

// ─── Barricade pool ───────────────────────────────────────────────────────────
function BarricadePool({ spawnTimer, hitCooldown }) {
  const data = useRef(
    Array.from({ length: MAX_BARRICADES }, (_, i) => ({
      id: i, active: false, lane: 1, z: PARK_Z,
    }))
  )
  const refs = useRef(Array.from({ length: MAX_BARRICADES }, () => null))

  useFrame((_, delta) => {
    const { phase, speed, zone, playerLane } = useGameStore.getState()
    if (phase !== 'playing') return

    const playerX = LANES[playerLane]

    data.current.forEach((slot) => {
      if (!slot.active) return
      const ref = refs.current[slot.id]
      if (!ref) return

      slot.z += speed * delta
      ref.position.z = slot.z

      // Despawn
      if (slot.z > DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      // Collision
      if (hitCooldown.current > 0) return
      if (aabbXZ(
        LANES[slot.lane], slot.z, HALF.barricade.x, HALF.barricade.z,
        playerX, 2, HALF.player.x, HALF.player.z
      )) {
        slot.active = false
        ref.position.z = PARK_Z
        useGameStore.getState().takeDamage('obstacle')
        hitCooldown.current = 1.5
      }
    })

    // Spawn
    spawnTimer.barricade -= delta
    if (spawnTimer.barricade <= 0) {
      const zoneData = ZONES[zone]
      spawnTimer.barricade = zoneData.obstacleRate + (Math.random() - 0.5) * 0.8

      const slot = data.current.find(s => !s.active)
      if (slot) {
        slot.active = true
        slot.lane = Math.floor(Math.random() * 3)
        slot.z = SPAWN_Z
        const ref = refs.current[slot.id]
        if (ref) {
          ref.position.x = LANES[slot.lane]
          ref.position.z = SPAWN_Z
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_BARRICADES }).map((_, i) => (
        <group
          key={i}
          ref={el => { refs.current[i] = el }}
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
      id: i, active: false, lane: 1, z: PARK_Z,
    }))
  )
  const refs = useRef(Array.from({ length: MAX_ENERGYWALLS }, () => null))

  useFrame((_, delta) => {
    const { phase, speed, zone, playerLane } = useGameStore.getState()
    if (phase !== 'playing' || zone < 2) return

    const playerX = LANES[playerLane]

    data.current.forEach((slot) => {
      if (!slot.active) return
      const ref = refs.current[slot.id]
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
        hitCooldown.current = 1.5
      }
    })

    // Energy walls spawn less often than barricades, mixed in with barricade timer
    spawnTimer.energyWall -= delta
    if (spawnTimer.energyWall <= 0) {
      const zoneData = ZONES[zone]
      spawnTimer.energyWall = zoneData.obstacleRate * 1.8 + Math.random()

      const slot = data.current.find(s => !s.active)
      if (slot) {
        slot.active = true
        slot.lane = Math.floor(Math.random() * 3)
        slot.z = SPAWN_Z
        const ref = refs.current[slot.id]
        if (ref) {
          ref.position.x = LANES[slot.lane]
          ref.position.z = SPAWN_Z
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_ENERGYWALLS }).map((_, i) => (
        <group
          key={i}
          ref={el => { refs.current[i] = el }}
          position={[LANES[1], 0, PARK_Z]}
        >
          <EnergyWall />
        </group>
      ))}
    </>
  )
}

// ─── Main export — composes both pools with shared timers ─────────────────────
export default function ObstaclePool() {
  // Shared spawn timers (plain object ref — not React state)
  const spawnTimer = useRef({ barricade: 2.0, energyWall: 4.0 })
  // Shared invincibility timer after any hit
  const hitCooldown = useRef(0)

  // Tick down hitCooldown centrally
  useFrame((_, delta) => {
    if (hitCooldown.current > 0) hitCooldown.current -= delta
  })

  return (
    <>
      <BarricadePool spawnTimer={spawnTimer.current} hitCooldown={hitCooldown} />
      <EnergyWallPool spawnTimer={spawnTimer.current} hitCooldown={hitCooldown} />
    </>
  )
}
