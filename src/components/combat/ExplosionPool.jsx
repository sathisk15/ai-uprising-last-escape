import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const MAX_EXP  = 8
const PARK_Z   = -800
const DURATION = 0.45  // seconds for one explosion

// Singleton so BulletPool can trigger explosions without prop drilling
export const explosionSharedData = { slots: null }

export default function ExplosionPool() {
  const slots = useRef(
    Array.from({ length: MAX_EXP }, (_, i) => ({
      id: i,
      active: false,
      elapsed: 0,
      groupRef: null,
      coreRef: null,
      ringRef: null,
    }))
  )

  // Register singleton on mount
  React.useEffect(() => {
    explosionSharedData.slots = slots.current
    return () => { explosionSharedData.slots = null }
  }, [])

  useFrame((_, delta) => {
    slots.current.forEach((slot) => {
      if (!slot.active) return
      slot.elapsed += delta
      const t = Math.min(slot.elapsed / DURATION, 1)

      if (slot.groupRef) {
        slot.groupRef.scale.setScalar(0.3 + t * 2.8)
      }
      if (slot.coreRef?.material) {
        slot.coreRef.material.opacity = Math.max(0, 1 - t * 1.4)
        slot.coreRef.material.emissiveIntensity = (1 - t) * 4
      }
      if (slot.ringRef?.material) {
        slot.ringRef.material.opacity = Math.max(0, 0.7 - t * 1.2)
      }

      if (t >= 1) {
        slot.active = false
        if (slot.groupRef) {
          slot.groupRef.position.z = PARK_Z
          slot.groupRef.scale.setScalar(0.01)
        }
      }
    })
  })

  return (
    <>
      {Array.from({ length: MAX_EXP }).map((_, i) => {
        const slot = slots.current[i]
        return (
          <group
            key={i}
            ref={el => { slot.groupRef = el }}
            position={[0, 1.5, PARK_Z]}
            scale={0.01}
          >
            {/* Core fireball */}
            <mesh ref={el => { slot.coreRef = el }}>
              <sphereGeometry args={[0.5, 10, 10]} />
              <meshStandardMaterial
                color="#ff6600"
                emissive="#ff3300"
                emissiveIntensity={4}
                transparent
                opacity={1}
                toneMapped={false}
              />
            </mesh>
            {/* Outer ring */}
            <mesh ref={el => { slot.ringRef = el }}>
              <sphereGeometry args={[0.9, 10, 10]} />
              <meshStandardMaterial
                color="#ffaa00"
                emissive="#ff8800"
                emissiveIntensity={1.5}
                transparent
                opacity={0.6}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

// Helper called by BulletPool to trigger an explosion at world position
export function spawnExplosion(x, y, z) {
  const slot = explosionSharedData.slots?.find(s => !s.active)
  if (!slot) return
  slot.active  = true
  slot.elapsed = 0
  if (slot.groupRef) {
    slot.groupRef.position.set(x, y, z)
    slot.groupRef.scale.setScalar(0.3)
    if (slot.coreRef?.material)  slot.coreRef.material.opacity  = 1
    if (slot.ringRef?.material)  slot.ringRef.material.opacity  = 0.6
  }
}
