import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'
import usePlayerInput from './usePlayerInput'
import { LANES } from '../../game/zones'
import { damageSignal } from '../../game/shakeSignal'

function Wheel({ position }) {
  return (
    <group position={position}>
      {/* Tyre */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 8]} />
        <meshStandardMaterial color="#555566" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Hub glow */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.29, 6]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}

const BASE_Y          = 0.5
const JUMP_HEIGHT     = 2.8
const JUMP_DURATION   = 0.75
const SLIDE_DURATION  = 0.6
const START_ANIM_DUR  = 1.2   // seconds car takes to zoom in from behind camera
const START_Z_FROM    = 22    // z position behind camera (camera sits at z≈9)
const START_Z_TO      = 2     // final play position z

const DAMAGE_FLASH_DUR = 0.35  // seconds the red damage overlay stays lit

export default function PlayerVehicle() {
  const groupRef      = useRef()
  const jumpT         = useRef(0)
  const slideT        = useRef(0)
  const shieldRef     = useRef()
  const exhaustRef    = useRef()
  const flashMeshRef  = useRef()   // red damage overlay mesh
  const damageFlashT  = useRef(0)  // countdown for damage flash
  const dyingT        = useRef(0)  // 0→DEATH_ANIM_DUR during crash
  const startT        = useRef(-1) // -1 = not animating; 0→START_ANIM_DUR = driving in
  const prevPhase     = useRef('menu')
  // Crash blast — array of 6 sphere refs
  const blastRefs     = useRef([null, null, null, null, null, null])
  const blastData     = useRef([])  // [{dx,dy,speed,scale} per sphere]
  const smokeRef      = useRef()    // dark smoke billow
  const deathX        = useRef(0)   // car's x position at moment of death

  usePlayerInput()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { phase, playerLane, isJumping, isSliding,
            endJump, endSlide, shieldActive, speedBoostActive } = useGameStore.getState()

    // ── Detect game-start transition → trigger zoom-in from behind camera ──
    if (phase === 'playing' && prevPhase.current !== 'playing') {
      startT.current = 0
      dyingT.current = 0
      groupRef.current.position.y  = BASE_Y
      groupRef.current.position.z  = START_Z_FROM
      groupRef.current.rotation.x  = 0
      groupRef.current.rotation.z  = 0
    }

    // ── Capture lane position the moment death begins ─────────────────────
    if (phase === 'dying' && prevPhase.current !== 'dying') {
      deathX.current = groupRef.current.position.x
    }
    prevPhase.current = phase

    // ── Start zoom-in animation (z-axis: behind camera → play position) ───
    if (startT.current >= 0 && startT.current < START_ANIM_DUR) {
      startT.current += delta
      const t    = Math.min(startT.current / START_ANIM_DUR, 1)
      const ease = 1 - Math.pow(1 - t, 2)   // quadratic ease-out: fast entry, smooth stop
      groupRef.current.position.z = START_Z_FROM + (START_Z_TO - START_Z_FROM) * ease
      groupRef.current.position.y = BASE_Y
      // nose dips forward while speeding in, straightens on arrival
      groupRef.current.rotation.x = -(1 - ease) * 0.3
      if (startT.current >= START_ANIM_DUR) {
        groupRef.current.position.z = START_Z_TO
        groupRef.current.rotation.x = 0
        startT.current = -1
      }
      return  // don't process other movement until car is in position
    }

    // ── Death / crash animation ───────────────────────────────────────────
    if (phase === 'dying') {
      const prevT = dyingT.current
      dyingT.current += delta
      const raw = dyingT.current

      // ── Phase 1 (0–0.35s): impact shake + skid to stop ─────────────────
      if (raw < 0.35) {
        const shake = 0.4 * (1 - raw / 0.35)
        groupRef.current.position.x = deathX.current + (Math.random() * 2 - 1) * shake
        groupRef.current.position.z = START_Z_TO + (Math.random() * 2 - 1) * shake * 0.4
        groupRef.current.rotation.z = (Math.random() * 2 - 1) * shake * 0.5
      }

      // ── Trigger blast at 0.3s (first frame crossing it) ─────────────────
      if (prevT < 0.3 && raw >= 0.3) {
        blastData.current = Array.from({ length: 6 }, (_, i) => ({
          angle: (i / 6) * Math.PI * 2,
          speed: 1.8 + Math.random() * 2.2,
          rise:  0.8 + Math.random() * 1.4,
          size:  0.25 + Math.random() * 0.35,
        }))
        if (blastRefs.current[0]) {
          blastRefs.current.forEach((m) => { if (m) m.visible = true })
        }
        if (smokeRef.current) smokeRef.current.visible = true
      }

      // ── Animate blast spheres (0.3s → 1.4s) ────────────────────────────
      if (raw >= 0.3 && raw < 1.4 && blastData.current.length) {
        const bt = (raw - 0.3) / 1.1   // 0→1 within blast window
        const fade = Math.max(0, 1 - bt)
        blastRefs.current.forEach((m, i) => {
          if (!m) return
          const d = blastData.current[i]
          if (!d) return
          const dist = d.speed * bt
          m.position.x = Math.cos(d.angle) * dist
          m.position.y = BASE_Y + d.rise * bt * (1 - bt * 0.4)
          m.position.z = Math.sin(d.angle) * dist
          const s = d.size * (0.3 + bt * 1.6)
          m.scale.setScalar(s)
          m.material.opacity = fade * 0.92
          m.visible = fade > 0.01
        })
        // Smoke billow
        if (smokeRef.current) {
          const ss = 0.3 + bt * 2.8
          smokeRef.current.scale.setScalar(ss)
          smokeRef.current.material.opacity = Math.max(0, 0.55 * (1 - bt * 0.7))
          smokeRef.current.position.y = BASE_Y + bt * 1.8
        }
      } else if (raw >= 1.4) {
        blastRefs.current.forEach((m) => { if (m) m.visible = false })
        if (smokeRef.current) smokeRef.current.visible = false
      }

      // ── Phase 2 (0.3s–1.0s): car rolls and tilts, then holds in place ───
      if (raw >= 0.3) {
        const rollT = Math.min((raw - 0.3) / 0.7, 1)
        const ease  = 1 - Math.pow(1 - rollT, 2)
        groupRef.current.rotation.z = ease * 1.2
        groupRef.current.rotation.x = ease * 0.2   // tail dips, nose lifts
        // Car is completely frozen — camera flies past, not the car moving
        groupRef.current.position.x = deathX.current
        groupRef.current.position.z = START_Z_TO
        groupRef.current.position.y = BASE_Y
      }

      if (shieldRef.current)  shieldRef.current.visible  = false
      if (exhaustRef.current) exhaustRef.current.visible = false
      return
    }

    if (phase !== 'playing' && phase !== 'paused') return

    // ── Damage flash ──────────────────────────────────────────────────────
    if (damageSignal.pending) {
      damageSignal.pending = false
      damageFlashT.current = DAMAGE_FLASH_DUR
    }
    if (damageFlashT.current > 0) {
      damageFlashT.current -= delta
      if (flashMeshRef.current) {
        const opacity = Math.max(0, damageFlashT.current / DAMAGE_FLASH_DUR) * 0.65
        flashMeshRef.current.material.opacity = opacity
        flashMeshRef.current.visible = opacity > 0
      }
    } else if (flashMeshRef.current) {
      flashMeshRef.current.visible = false
    }

    // ── Lane lerp + tilt ─────────────────────────────────────────────────
    const targetX = LANES[playerLane]
    const curX    = groupRef.current.position.x
    groupRef.current.position.x += (targetX - curX) * Math.min(delta * 9, 1)
    groupRef.current.rotation.z  = -(targetX - curX) * 0.15
    groupRef.current.rotation.x  = 0

    // ── Jump arc ──────────────────────────────────────────────────────────
    if (isJumping) {
      jumpT.current = Math.min(jumpT.current + delta / JUMP_DURATION, 1)
      groupRef.current.position.y = BASE_Y + Math.sin(jumpT.current * Math.PI) * JUMP_HEIGHT
      groupRef.current.scale.y    = 1
      if (jumpT.current >= 1) { jumpT.current = 0; groupRef.current.position.y = BASE_Y; endJump() }
    // ── Slide squish ──────────────────────────────────────────────────────
    } else if (isSliding) {
      slideT.current = Math.min(slideT.current + delta / SLIDE_DURATION, 1)
      const squish = 1 - Math.sin(slideT.current * Math.PI) * 0.55
      groupRef.current.scale.y    = squish
      groupRef.current.position.y = BASE_Y - (1 - squish) * 0.35
      if (slideT.current >= 1) { slideT.current = 0; groupRef.current.scale.y = 1; groupRef.current.position.y = BASE_Y; endSlide() }
    } else {
      groupRef.current.position.y = BASE_Y
      groupRef.current.scale.y    = 1
      jumpT.current  = 0
      slideT.current = 0
    }

    // ── Boost exhaust flames ──────────────────────────────────────────────
    if (exhaustRef.current) {
      exhaustRef.current.visible = speedBoostActive
      if (speedBoostActive) {
        exhaustRef.current.scale.z = 0.7 + Math.random() * 0.6
      }
    }

    // ── Shield bubble ─────────────────────────────────────────────────────
    if (shieldRef.current) {
      shieldRef.current.visible = shieldActive
      if (shieldActive) {
        const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.06
        shieldRef.current.scale.setScalar(pulse)
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, BASE_Y, START_Z_FROM]}>

      {/* ── Main body ────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.5, 2.5]} />
        <meshStandardMaterial color="#1a3d6e" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Side neon stripes */}
      <mesh position={[-0.61, 0.08, 0]}>
        <boxGeometry args={[0.01, 0.06, 2.2]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.61, 0.08, 0]}>
        <boxGeometry args={[0.01, 0.06, 2.2]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* ── Damage flash overlay (red tint over whole car) ───────────────── */}
      <mesh ref={flashMeshRef} position={[0, 0.2, 0]} visible={false}>
        <boxGeometry args={[1.4, 1.0, 2.8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2}
          transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* ── Cabin ────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.52, -0.15]}>
        <boxGeometry args={[0.88, 0.38, 1.2]} />
        <meshStandardMaterial color="#0f2a4a" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Windshield tint */}
      <mesh position={[0, 0.54, 0.46]}>
        <boxGeometry args={[0.82, 0.3, 0.04]} />
        <meshStandardMaterial color="#001a33" metalness={0.1} roughness={0.1} opacity={0.85} transparent />
      </mesh>

      {/* ── Hood ─────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.24, 0.9]}>
        <boxGeometry args={[1.1, 0.12, 0.6]} />
        <meshStandardMaterial color="#1a3d6e" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Front bumper ─────────────────────────────────────────────────── */}
      <mesh position={[0, -0.06, 1.3]}>
        <boxGeometry args={[1.15, 0.2, 0.16]} />
        <meshStandardMaterial color="#0a1520" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bumper accent bar */}
      <mesh position={[0, 0.02, 1.39]}>
        <boxGeometry args={[0.9, 0.04, 0.02]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* ── Rear spoiler ─────────────────────────────────────────────────── */}
      <mesh position={[0, 0.52, -1.18]}>
        <boxGeometry args={[1.05, 0.07, 0.08]} />
        <meshStandardMaterial color="#0a1520" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* ── Exhaust pipes ────────────────────────────────────────────────── */}
      <mesh position={[-0.3, -0.12, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.18, 8]} />
        <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.3, -0.12, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.18, 8]} />
        <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* ── Wheels ───────────────────────────────────────────────────────── */}
      <Wheel position={[-0.66, -0.15,  0.85]} />
      <Wheel position={[ 0.66, -0.15,  0.85]} />
      <Wheel position={[-0.66, -0.15, -0.85]} />
      <Wheel position={[ 0.66, -0.15, -0.85]} />

      {/* ── Headlights ───────────────────────────────────────────────────── */}
      <mesh position={[-0.35, 0.1, 1.27]}>
        <boxGeometry args={[0.22, 0.1, 0.03]} />
        <meshStandardMaterial color="#ddeeff" emissive="#aaddff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[ 0.35, 0.1, 1.27]}>
        <boxGeometry args={[0.22, 0.1, 0.03]} />
        <meshStandardMaterial color="#ddeeff" emissive="#aaddff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.1, 2.4]} intensity={2.5} color="#cce8ff" distance={12} decay={2} />

      {/* ── Tail lights ──────────────────────────────────────────────────── */}
      <mesh position={[-0.42, 0.1, -1.27]}>
        <boxGeometry args={[0.18, 0.08, 0.03]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff0000" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[ 0.42, 0.1, -1.27]}>
        <boxGeometry args={[0.18, 0.08, 0.03]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff0000" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* ── Boost exhaust flames ─────────────────────────────────────────── */}
      <group ref={exhaustRef} visible={false}>
        <mesh position={[-0.3, -0.12, -1.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.55, 6]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={4} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh position={[0.3, -0.12, -1.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.55, 6]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={4} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh position={[-0.3, -0.12, -1.52]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffcc44" emissiveIntensity={5} toneMapped={false} />
        </mesh>
        <mesh position={[0.3, -0.12, -1.52]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffcc44" emissiveIntensity={5} toneMapped={false} />
        </mesh>
      </group>

      {/* ── Shield bubble ────────────────────────────────────────────────── */}
      <group ref={shieldRef} visible={false} position={[0, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshStandardMaterial color="#cc44ff" emissive="#aa00ff" emissiveIntensity={1.2}
            transparent opacity={0.18} toneMapped={false} side={2} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.6, 0.035, 8, 40]} />
          <meshStandardMaterial color="#ee88ff" emissive="#cc00ff" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.035, 8, 40]} />
          <meshStandardMaterial color="#ee88ff" emissive="#cc00ff" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>

      {/* ── Crash blast spheres (6 fireballs) ───────────────────────────── */}
      {[0,1,2,3,4,5].map((i) => (
        <mesh key={i} ref={(el) => { blastRefs.current[i] = el }} visible={false} position={[0, BASE_Y, 0]}>
          <sphereGeometry args={[1, 7, 7]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#ff4400' : '#ffaa00'}
            emissive={i % 2 === 0 ? '#ff2200' : '#ff8800'}
            emissiveIntensity={5}
            transparent opacity={0}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Crash smoke billow ───────────────────────────────────────────── */}
      <mesh ref={smokeRef} visible={false} position={[0, BASE_Y, 0]}>
        <sphereGeometry args={[1, 7, 7]} />
        <meshStandardMaterial
          color="#1a1a1a"
          transparent opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

    </group>
  )
}
