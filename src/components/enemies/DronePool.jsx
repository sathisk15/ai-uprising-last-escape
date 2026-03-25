import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import { LANES, ZONES } from '../../game/zones'
import { aabbXZ, HALF } from '../../game/physics'
import { droneSharedData } from './droneData'
import Drone from './Drone'

const MAX_DRONES = 6
const SPAWN_Z   = -72
const PARK_Z    = -600
const DESPAWN_Z = 18

// Hover amplitude and frequency
const HOVER_AMP  = 0.18
const HOVER_FREQ = 2.2

// Lateral sweep: drone drifts between its spawn lane and adjacent lanes
const SWEEP_SPEED = 1.4   // units/s max lateral speed
const SWEEP_AMP   = 1.2   // max X deviation from lane centre

export default function DronePool({ hitCooldown }) {
  const data = useRef(
    Array.from({ length: MAX_DRONES }, (_, i) => ({

      id: i,
      active: false,
      lane: 1,
      x: 0,           // current world X (for sweep)
      targetX: 0,
      z: PARK_Z,
      phase: Math.random() * Math.PI * 2,  // hover phase offset
      sweepTimer: 0,
    }))
  )
  const refs      = useRef(Array.from({ length: MAX_DRONES }, () => null))
  const spawnTimer = useRef(5.0)

  // Register slot array so BulletPool can check collisions
  useEffect(() => {
    droneSharedData.slots = data.current
    return () => { droneSharedData.slots = null }
  }, [])

  useFrame((_, delta) => {
    const { phase, speed, zone, playerLane } = useGameStore.getState()
    if (phase !== 'playing') return

    const zoneData  = ZONES[zone]
    const playerX   = LANES[playerLane]
    const t         = performance.now() / 1000

    data.current.forEach((slot) => {
      if (!slot.active) return
      const ref = refs.current[slot.id]
      if (!ref) return

      // Advance forward (same direction as road)
      slot.z += speed * delta
      ref.position.z = slot.z

      // Hover bob
      ref.position.y = 1.6 + Math.sin(t * HOVER_FREQ + slot.phase) * HOVER_AMP

      // Lateral sweep — periodically pick a new target X around the lane centre
      slot.sweepTimer -= delta
      if (slot.sweepTimer <= 0) {
        slot.sweepTimer = 1.0 + Math.random() * 1.2
        const laneX = LANES[slot.lane]
        slot.targetX = laneX + (Math.random() * 2 - 1) * SWEEP_AMP
        // Clamp to road bounds
        slot.targetX = Math.max(-3.5, Math.min(3.5, slot.targetX))
      }
      slot.x += (slot.targetX - slot.x) * Math.min(delta * SWEEP_SPEED * 2, 1)
      ref.position.x = slot.x

      // Despawn
      if (slot.z > DESPAWN_Z) {
        slot.active = false
        ref.position.z = PARK_Z
        return
      }

      // Collision with player
      if (hitCooldown.current > 0) return
      if (aabbXZ(
        slot.x, slot.z, HALF.drone.x, HALF.drone.z,
        playerX, 2, HALF.player.x, HALF.player.z
      )) {
        slot.active = false
        ref.position.z = PARK_Z
        useGameStore.getState().takeDamage('drone')
        hitCooldown.current = 1.5
      }
    })

    // Spawn timer
    spawnTimer.current -= delta
    if (spawnTimer.current <= 0) {
      spawnTimer.current = zoneData.droneRate + (Math.random() - 0.5) * 1.0

      const slot = data.current.find(s => !s.active)
      if (slot) {
        const laneIdx = Math.floor(Math.random() * 3)
        slot.active   = true
        slot.lane     = laneIdx
        slot.x        = LANES[laneIdx]
        slot.targetX  = LANES[laneIdx]
        slot.z        = SPAWN_Z
        slot.phase    = Math.random() * Math.PI * 2
        slot.sweepTimer = 0.5

        const ref = refs.current[slot.id]
        if (ref) {
          ref.position.set(slot.x, 1.6, SPAWN_Z)
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_DRONES }).map((_, i) => (
        <group
          key={i}
          ref={el => {
            refs.current[i] = el
            // Also store on the slot so BulletPool can deactivate via groupRef
            if (data.current[i]) data.current[i].groupRef = el
          }}
          position={[LANES[1], 1.6, PARK_Z]}
        >
          <Drone />
        </group>
      ))}
    </>
  )
}
