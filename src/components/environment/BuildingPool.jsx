import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

// Match road tile dimensions exactly
const TILE_LENGTH = 64
const RECYCLE_Z = 50

// ─── Zone-specific visual styles ───────────────────────────────────────────
const ZONE_STYLES = {
  1: {
    wall: '#2e1a0e',
    wallEmissive: '#1a0800',
    wallEmissiveIntensity: 0.15,
    windowOn: '#ff8833',
    windowOnIntensity: 1.2,
    accent: '#5c2e00',
    accentEmissive: '#cc5500',
    accentEmissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.9,
  },
  2: {
    wall: '#141f14',
    wallEmissive: '#001a05',
    wallEmissiveIntensity: 0.12,
    windowOn: '#00ff88',
    windowOnIntensity: 1.5,
    accent: '#003d10',
    accentEmissive: '#00cc44',
    accentEmissiveIntensity: 0.8,
    metalness: 0.6,
    roughness: 0.7,
  },
  3: {
    wall: '#200808',
    wallEmissive: '#1a0000',
    wallEmissiveIntensity: 0.2,
    windowOn: '#ff1a1a',
    windowOnIntensity: 1.8,
    accent: '#5a0000',
    accentEmissive: '#ff0000',
    accentEmissiveIntensity: 1.0,
    metalness: 0.7,
    roughness: 0.6,
  },
}

// ─── Building definitions per tile (relative z within tile, all static) ────
// Left side: x negative (road edge at ~-4.4)
// Right side: x positive (road edge at ~+4.4)
const LEFT_TILE_BUILDINGS = [
  { zOff: -26, x: -7.0, w: 4.2, h: 14, d: 3.5, wr: 4, wc: 2, detail: 'chimney', dh: 2.5 },
  { zOff: -13, x: -9.5, w: 2.8, h: 8,  d: 2.5, wr: 2, wc: 1, detail: 'antenna', dh: 3.0 },
  { zOff:  -2, x: -6.0, w: 3.8, h: 18, d: 3.0, wr: 6, wc: 2, detail: 'tower',   dh: 2.0 },
  { zOff:  12, x: -8.0, w: 3.2, h: 10, d: 3.0, wr: 3, wc: 2, detail: 'none',    dh: 0   },
  { zOff:  24, x: -6.8, w: 2.6, h: 12, d: 2.5, wr: 4, wc: 1, detail: 'chimney', dh: 1.8 },
]

const RIGHT_TILE_BUILDINGS = [
  { zOff: -22, x:  7.2, w: 4.0, h: 16, d: 3.5, wr: 5, wc: 2, detail: 'tower',   dh: 2.2 },
  { zOff:  -8, x:  5.8, w: 3.0, h: 9,  d: 3.0, wr: 3, wc: 2, detail: 'none',    dh: 0   },
  { zOff:   4, x:  9.8, w: 2.5, h: 11, d: 2.0, wr: 3, wc: 1, detail: 'antenna', dh: 3.5 },
  { zOff:  16, x:  6.5, w: 3.5, h: 20, d: 3.0, wr: 7, wc: 2, detail: 'chimney', dh: 2.0 },
  { zOff:  27, x:  8.5, w: 2.8, h: 7,  d: 2.5, wr: 2, wc: 1, detail: 'none',    dh: 0   },
]

// Deterministic window "lit" state – stable across renders
function isWindowLit(buildingIdx, row, col) {
  const v = Math.sin(buildingIdx * 91 + row * 17 + col * 41) * 43758.5453
  return (v - Math.floor(v)) > 0.28  // ~72% windows lit
}

// ─── Single building mesh ───────────────────────────────────────────────────
function Building({ def, bIdx, style }) {
  const { x, w, h, d, wr, wc, detail, dh } = def
  const yBase = h / 2  // pivot at ground level

  // Pre-compute window grid
  const windows = useMemo(() => {
    const out = []
    const xStep = w / (wc + 1)
    const yStep = (h - 2.0) / (wr + 0.5)
    for (let r = 0; r < wr; r++) {
      for (let c = 0; c < wc; c++) {
        out.push({
          key: `${r}-${c}`,
          wx: -w / 2 + xStep * (c + 1),
          wy: -h / 2 + 1.0 + yStep * r,
          lit: isWindowLit(bIdx, r, c),
        })
      }
    }
    return out
  }, [w, h, wr, wc, bIdx])

  return (
    <group position={[x, yBase, 0]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={style.wall}
          emissive={style.wallEmissive}
          emissiveIntensity={style.wallEmissiveIntensity}
          metalness={style.metalness}
          roughness={style.roughness}
        />
      </mesh>

      {/* Windows on front face (facing camera) */}
      {windows.map(win => (
        <mesh key={win.key} position={[win.wx, win.wy, d / 2 + 0.02]}>
          <planeGeometry args={[0.35, 0.45]} />
          <meshStandardMaterial
            color={win.lit ? style.windowOn : '#0a0a0a'}
            emissive={win.lit ? style.windowOn : '#000000'}
            emissiveIntensity={win.lit ? style.windowOnIntensity * 0.65 : 0}
            toneMapped={false}
          />
        </mesh>
      ))}


      {/* Rooftop detail: chimney */}
      {detail === 'chimney' && (
        <>
          <mesh position={[w * 0.25, h / 2 + dh / 2, 0]}>
            <cylinderGeometry args={[0.22, 0.28, dh, 6]} />
            <meshStandardMaterial
              color={style.accent}
              emissive={style.accentEmissive}
              emissiveIntensity={style.accentEmissiveIntensity * 0.5}
              metalness={0.7}
            />
          </mesh>
          {/* Smoke ring / chimney cap glow */}
          <mesh position={[w * 0.25, h / 2 + dh + 0.1, 0]}>
            <torusGeometry args={[0.3, 0.06, 6, 10]} />
            <meshStandardMaterial
              color={style.accentEmissive}
              emissive={style.accentEmissive}
              emissiveIntensity={style.accentEmissiveIntensity}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Rooftop detail: antenna */}
      {detail === 'antenna' && (
        <>
          <mesh position={[0, h / 2 + dh / 2, 0]}>
            <cylinderGeometry args={[0.04, 0.06, dh, 5]} />
            <meshStandardMaterial
              color={style.accent}
              emissive={style.accentEmissive}
              emissiveIntensity={style.accentEmissiveIntensity * 0.4}
              metalness={0.8}
            />
          </mesh>
          {/* Blinking light at tip */}
          <mesh position={[0, h / 2 + dh + 0.15, 0]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial
              color={style.windowOn}
              emissive={style.windowOn}
              emissiveIntensity={style.windowOnIntensity * 1.5}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Rooftop detail: tower (taller secondary structure) */}
      {detail === 'tower' && (
        <>
          <mesh position={[-w * 0.2, h / 2 + dh / 2, 0]}>
            <boxGeometry args={[w * 0.35, dh, d * 0.5]} />
            <meshStandardMaterial
              color={style.accent}
              emissive={style.accentEmissive}
              emissiveIntensity={style.accentEmissiveIntensity * 0.3}
              metalness={style.metalness + 0.1}
              roughness={style.roughness - 0.1}
            />
          </mesh>
          {/* Tower accent stripe */}
          <mesh position={[-w * 0.2, h / 2 + dh, d * 0.25 + 0.02]}>
            <planeGeometry args={[w * 0.3, 0.12]} />
            <meshStandardMaterial
              color={style.accentEmissive}
              emissive={style.accentEmissive}
              emissiveIntensity={style.accentEmissiveIntensity}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Base accent stripe (ground-level glow band) */}
      <mesh position={[0, -h / 2 + 0.08, d / 2 + 0.02]}>
        <planeGeometry args={[w - 0.1, 0.14]} />
        <meshStandardMaterial
          color={style.accentEmissive}
          emissive={style.accentEmissive}
          emissiveIntensity={style.accentEmissiveIntensity * 0.7}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

// ─── One scrolling tile (a chunk containing multiple buildings) ─────────────
const BuildingTile = React.memo(function BuildingTile({ tileRef, initZ, defs, side, zone }) {
  const style = ZONE_STYLES[zone] || ZONE_STYLES[1]
  return (
    <group ref={tileRef} position={[0, 0, initZ]}>
      {defs.map((def, i) => (
        <group key={i} position={[0, 0, def.zOff]}>
          <Building def={def} bIdx={i + (side === 'right' ? 100 : 0)} style={style} />
        </group>
      ))}
    </group>
  )
})

// ─── Main export ─────────────────────────────────────────────────────────────
export default function BuildingPool() {
  // Two tile refs per side (4 tiles total) — same double-buffer as Road
  const leftA  = useRef()
  const leftB  = useRef()
  const rightA = useRef()
  const rightB = useRef()

  const zone = useGameStore(s => s.zone)

  useFrame((_, delta) => {
    const { phase, speed } = useGameStore.getState()
    if (phase !== 'playing') return

    const move = speed * delta

    // Left side
    if (leftA.current)  leftA.current.position.z  += move
    if (leftB.current)  leftB.current.position.z  += move
    if (rightA.current) rightA.current.position.z += move
    if (rightB.current) rightB.current.position.z += move

    // Recycle (mirror road logic)
    if (leftA.current  && leftA.current.position.z  > RECYCLE_Z) leftA.current.position.z  = leftB.current.position.z  - TILE_LENGTH
    if (leftB.current  && leftB.current.position.z  > RECYCLE_Z) leftB.current.position.z  = leftA.current.position.z  - TILE_LENGTH
    if (rightA.current && rightA.current.position.z > RECYCLE_Z) rightA.current.position.z = rightB.current.position.z - TILE_LENGTH
    if (rightB.current && rightB.current.position.z > RECYCLE_Z) rightB.current.position.z = rightA.current.position.z - TILE_LENGTH
  })

  return (
    <>
      {/* Left side – two staggered tiles */}
      <BuildingTile tileRef={leftA}  initZ={0}            defs={LEFT_TILE_BUILDINGS}  side="left"  zone={zone} />
      <BuildingTile tileRef={leftB}  initZ={-TILE_LENGTH} defs={LEFT_TILE_BUILDINGS}  side="left"  zone={zone} />

      {/* Right side – two staggered tiles */}
      <BuildingTile tileRef={rightA} initZ={0}            defs={RIGHT_TILE_BUILDINGS} side="right" zone={zone} />
      <BuildingTile tileRef={rightB} initZ={-TILE_LENGTH} defs={RIGHT_TILE_BUILDINGS} side="right" zone={zone} />
    </>
  )
}
