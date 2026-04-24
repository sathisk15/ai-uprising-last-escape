import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const MAX_EXP    = 8
const PARK_Z     = -800
const DURATION   = 0.9
const DEBRIS_COUNT = 8

// Random debris velocities per slot (regenerated each spawn)
function makeDebrisVels() {
  return Array.from({ length: DEBRIS_COUNT }, () => ({
    vx: (Math.random() - 0.5) * 6,
    vy: 2 + Math.random() * 4,
    vz: (Math.random() - 0.5) * 6,
  }))
}

export const explosionSharedData = { slots: null }

export default function ExplosionPool() {
  const slots = useRef(
    Array.from({ length: MAX_EXP }, (_, i) => ({
      id: i, active: false, elapsed: 0,
      groupRef: null, flashRef: null, coreRef: null,
      shock1Ref: null, shock2Ref: null,
      smokeRef: null, lightRef: null,
      debrisRefs: Array.from({ length: DEBRIS_COUNT }, () => null),
      debrisVels: makeDebrisVels(),
      // per-debris start positions (reset on spawn)
      debrisPos: Array.from({ length: DEBRIS_COUNT }, () => ({ x: 0, y: 0, z: 0 })),
    }))
  )

  React.useEffect(() => {
    explosionSharedData.slots = slots.current
    return () => { explosionSharedData.slots = null }
  }, [])

  useFrame((_, delta) => {
    slots.current.forEach((slot) => {
      if (!slot.active) return
      slot.elapsed += delta
      const t = Math.min(slot.elapsed / DURATION, 1)

      // ── Flash (0–0.12s) ──────────────────────────────────────────────────────
      if (slot.flashRef) {
        const ft = Math.min(t / 0.13, 1)
        slot.flashRef.scale.setScalar(1 + ft * 1.2)
        if (slot.flashRef.material)
          slot.flashRef.material.opacity = Math.max(0, 1 - ft * 1.3)
      }

      // ── Fireball — rises upward, expands more on Y ───────────────────────────
      if (slot.coreRef) {
        const ease = 1 - Math.pow(1 - t, 2.5)
        const sx = 0.2 + ease * 1.4   // moderate width
        const sy = 0.2 + ease * 2.2   // taller — fire rises
        slot.coreRef.scale.set(sx, sy, sx)
        if (slot.coreRef.material) {
          slot.coreRef.material.emissive.setRGB(1, Math.max(0.05, 0.7 - t * 0.8), 0)
          slot.coreRef.material.emissiveIntensity = Math.max(0, 6 - t * 7)
          slot.coreRef.material.opacity = Math.max(0, 1 - t * 1.1)
        }
      }

      // ── Shockwave ring 1 — ground, contained spread ──────────────────────────
      if (slot.shock1Ref) {
        const st = Math.min(t / 0.4, 1)
        const ease = 1 - Math.pow(1 - st, 3)
        const s = 0.05 + ease * 2.8   // max ~2.8 wide
        slot.shock1Ref.scale.set(s, 1, s)
        if (slot.shock1Ref.material)
          slot.shock1Ref.material.opacity = Math.max(0, 0.95 * (1 - st * 1.1))
      }

      // ── Shockwave ring 2 — tilted, tighter ──────────────────────────────────
      if (slot.shock2Ref) {
        const st = Math.min(Math.max((t - 0.05) / 0.45, 0), 1)
        const ease = 1 - Math.pow(1 - st, 3)
        const s = 0.05 + ease * 2.0   // max ~2.0
        slot.shock2Ref.scale.set(s, 1, s)
        if (slot.shock2Ref.material)
          slot.shock2Ref.material.opacity = Math.max(0, 0.7 * (1 - st * 1.2))
      }

      // ── Smoke — rises slowly, billows grey ───────────────────────────────────
      if (slot.smokeRef) {
        const st = Math.min(Math.max((t - 0.15) / 0.75, 0), 1)
        slot.smokeRef.scale.setScalar(0.1 + st * 2.8)
        slot.smokeRef.position.y = 0.3 + st * 1.6
        if (slot.smokeRef.material)
          slot.smokeRef.material.opacity = Math.max(0, 0.55 * st * (1 - st * 1.1))
      }

      // ── Debris particles — fly out with gravity ───────────────────────────────
      slot.debrisRefs.forEach((ref, di) => {
        if (!ref) return
        const vel = slot.debrisVels[di]
        const pos = slot.debrisPos[di]
        const dt  = slot.elapsed
        pos.x = vel.vx * dt
        pos.y = vel.vy * dt - 4.9 * dt * dt   // gravity
        pos.z = vel.vz * dt
        ref.position.set(pos.x, Math.max(0, pos.y), pos.z)
        const fade = Math.max(0, 1 - t * 1.4)
        if (ref.material) ref.material.opacity = fade
        ref.scale.setScalar(Math.max(0.1, 1 - t * 0.8))
      })

      // ── Light — warm flash then out ──────────────────────────────────────────
      if (slot.lightRef)
        slot.lightRef.intensity = Math.max(0, 14 * (1 - t * 3))

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
          <group key={i} ref={el => { slot.groupRef = el }} position={[0, 1, PARK_Z]} scale={0.01}>

            <pointLight ref={el => { slot.lightRef = el }}
              color="#ff6600" intensity={0} distance={18} decay={2} />

            {/* White-hot flash */}
            <mesh ref={el => { slot.flashRef = el }}>
              <sphereGeometry args={[0.6, 10, 10]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff"
                emissiveIntensity={14} transparent opacity={0}
                toneMapped={false} depthWrite={false} />
            </mesh>

            {/* Fireball */}
            <mesh ref={el => { slot.coreRef = el }}>
              <sphereGeometry args={[0.42, 14, 14]} />
              <meshStandardMaterial color="#ff4400" emissive="#ff6600"
                emissiveIntensity={6} transparent opacity={1}
                toneMapped={false} depthWrite={false} />
            </mesh>

            {/* Shockwave ring 1 — ground */}
            <mesh ref={el => { slot.shock1Ref = el }} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1, 0.075, 6, 40]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ff7700"
                emissiveIntensity={5} transparent opacity={0}
                toneMapped={false} depthWrite={false} />
            </mesh>

            {/* Shockwave ring 2 — tilted */}
            <mesh ref={el => { slot.shock2Ref = el }} rotation={[Math.PI / 4, 0.4, 0]}>
              <torusGeometry args={[1, 0.05, 6, 36]} />
              <meshStandardMaterial color="#ff8800" emissive="#ff5500"
                emissiveIntensity={4} transparent opacity={0}
                toneMapped={false} depthWrite={false} />
            </mesh>

            {/* Smoke puff */}
            <mesh ref={el => { slot.smokeRef = el }} position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshStandardMaterial color="#333333" emissive="#111111"
                emissiveIntensity={0} transparent opacity={0}
                depthWrite={false} roughness={1} />
            </mesh>

            {/* Debris particles */}
            {Array.from({ length: DEBRIS_COUNT }).map((_, di) => (
              <mesh key={di} ref={el => { slot.debrisRefs[di] = el }} position={[0, 0, 0]}>
                <sphereGeometry args={[0.09, 5, 5]} />
                <meshStandardMaterial
                  color={di % 2 === 0 ? '#ff6600' : '#ffcc00'}
                  emissive={di % 2 === 0 ? '#ff3300' : '#ff9900'}
                  emissiveIntensity={4}
                  transparent opacity={1}
                  toneMapped={false} depthWrite={false} />
              </mesh>
            ))}

          </group>
        )
      })}
    </>
  )
}

export function spawnExplosion(x, y, z) {
  const slot = explosionSharedData.slots?.find(s => !s.active)
  if (!slot) return
  slot.active  = true
  slot.elapsed = 0
  slot.debrisVels = makeDebrisVels()
  slot.debrisPos.forEach(p => { p.x = 0; p.y = 0; p.z = 0 })

  if (slot.groupRef) {
    slot.groupRef.position.set(x, y, z)
    slot.groupRef.scale.setScalar(1)
  }
  if (slot.flashRef) {
    slot.flashRef.scale.setScalar(1)
    if (slot.flashRef.material) slot.flashRef.material.opacity = 1
  }
  if (slot.coreRef) {
    slot.coreRef.scale.setScalar(0.2)
    if (slot.coreRef.material) {
      slot.coreRef.material.opacity = 1
      slot.coreRef.material.emissiveIntensity = 6
    }
  }
  if (slot.shock1Ref) {
    slot.shock1Ref.scale.set(0.05, 1, 0.05)
    if (slot.shock1Ref.material) slot.shock1Ref.material.opacity = 0.95
  }
  if (slot.shock2Ref) {
    slot.shock2Ref.scale.set(0.05, 1, 0.05)
    if (slot.shock2Ref.material) slot.shock2Ref.material.opacity = 0.7
  }
  if (slot.smokeRef) {
    slot.smokeRef.scale.setScalar(0.1)
    slot.smokeRef.position.y = 0.3
    if (slot.smokeRef.material) slot.smokeRef.material.opacity = 0
  }
  slot.debrisRefs.forEach(ref => {
    if (ref) {
      ref.position.set(0, 0, 0)
      ref.scale.setScalar(1)
      if (ref.material) ref.material.opacity = 1
    }
  })
  if (slot.lightRef) slot.lightRef.intensity = 14
}
