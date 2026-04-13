# AI Uprising: Last Escape

A browser-based 3D endless runner built with React, Three.js, and @react-three/fiber.
You are the last operative driving through a dystopian 2045 city to deliver the **BLACKOUT Protocol** — a kill-switch that shuts down the AI uprising. Survive three escalating zones, shoot drones, dodge obstacles, and make it to the end.

---

## Premise

In 2045, an AI network called **SIGNAL-0** has overrun global infrastructure. You are a resistance operative racing through the city to upload the BLACKOUT Protocol — a virus that wipes SIGNAL-0 from every node. The AI's drones and automated defences stand between you and the upload terminal.

---

## Tech Stack

| Layer | Library |
|---|---|
| Rendering | Three.js via `@react-three/fiber` |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| UI / Screens | React 18 + Tailwind CSS |
| Animations | GSAP 3 |
| State | Zustand 5 (persist middleware for high score) |
| Audio | Howler.js |
| Build | Vite 5 |
| Deploy | Firebase Hosting (`ai-uprising-last-escape`) |

All 3D objects are built from Three.js primitives (BoxGeometry, SphereGeometry, CylinderGeometry, etc.) — no external `.glb` or `.gltf` assets.

---

## Getting Started

```bash
npm install
npm run dev        # localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

---

## Controls

| Action | Keyboard | Mobile (touch) |
|---|---|---|
| Lane left | `Arrow Left` / `A` | Swipe left |
| Lane right | `Arrow Right` / `D` | Swipe right |
| Jump | `Space` / `Arrow Up` / `W` | Swipe up |
| Shoot | `Z` / `F` | Tap |
| Pause | `P` / `Escape` | — |

---

## Gameplay

### Zones

| Zone | Name | Speed | Obstacle Rate | Drone Rate | Fog | Threshold |
|---|---|---|---|---|---|---|
| 1 | Modern Wasteland | 22 u/s | 3.5 s | 6.0 s | `#5c3d1e` | 1500 m |
| 2 | Modern Industrial Complex | 33 u/s | 2.5 s | 4.0 s | `#1a3320` | 3500 m |
| 3 | Modern Core Stronghold | 44 u/s | 1.8 s | 2.5 s | `#3d0a0a` | 5500 m (victory) |

Each zone ends with a **zoneout** — the car drives forward into fog, the road clears, then the zone banner slams in. Zone 3 completion at 5500 m triggers the **Victory** screen.

### Resources

- **Health** (100%) — lost on obstacle and drone collision. Zero = game over.
- **Energy** — drains continuously. Rate: `1.2 + (zone−1) × 0.35` pts/s. Zero = game over.
- **Ammo** — starts at 15, max 30. Pick up ammo crates to resupply.

### Damage Values

| Source | Health lost |
|---|---|
| Obstacle collision | −20% |
| Drone body collision | −15% |
| ~~Drone projectile~~ (removed) | ~~−10%~~ |

A shared 1.5 s hit cooldown prevents double-damage from any source.

### Collectibles

Spawn every ~3.8 s at a random lane. Spawn stops 120 m before zone end.

| Item | Visual | Spawn weight | Effect |
|---|---|---|---|
| Energy Cell | Blue sphere + torus ring | 27% | +30 energy |
| Repair Pack | Green cross | 20% | +25 health |
| Data Chip | Cyan flat box + circuit lines | 14% | +150 score |
| Ammo Crate | Brown box + bullet silhouettes | 14% | +8 ammo |
| Shield Orb | Purple octahedron + rings | 13% | One-hit absorb |
| Speed Boost | Orange chevrons + glow core | 12% | 1.6× speed for 6 s |

### Scoring

- Distance driven contributes 1 pt/m continuously (`score = floor(distance) + kills × 100`)
- Drone kill: +100
- Data Chip pickup: +150
- Obstacle destroyed by bullet: +50
- High score persists in `localStorage` key `aiuprising-v1`

---

## Architecture

### State Machine (`gameStore.js`)

```
menu
 └─ startGame() ──────────────────────────────────────────► playing
                                                               │
                                         pauseGame() ◄────────┤────► paused ──► resumeGame() ──► playing
                                                               │
                                    distance >= threshold ─────┤
                                         nextZone() ──────────► zoneout (1.5s car drives into fog)
                                                               │
                                       beginTransition() ─────► transition (zone banner 2.2s)
                                                               │
                                    resumeFromTransition() ───► playing (zone+1)
                                                               │
                                   zone 3 distance >= 5500 ───► victory
                                                               │
                                         health/energy = 0 ───► dying (crash anim + camera flyby)
                                                               │
                                       completeGameOver() ────► gameover
                                                               │
                                          startGame() ────────► playing  (RETRY — full reset)
                                          goToMenu()  ────────► menu
```

### Key Store Actions (exact code)

```js
startGame: () => {
  set({ ...sessionDefaults, phase: 'playing' })
}
// sessionDefaults resets: phase, zone:1, score:0, distance:0, health:100,
// energy:100, ammo:15, kills:0, playerLane:1, speed:BASE_SPEED, isJumping:false

endGame: () => {
  const { score, highScore, setHighScore } = get()
  if (score > highScore) setHighScore(score)
  set({ phase: 'dying' })
}

completeGameOver: () => {
  set({ phase: 'gameover' })
}

nextZone: () => {
  const { zone } = get()
  if (zone >= 3) return
  set({ phase: 'zoneout' })
}

beginTransition: () => {
  const { phase, zone } = get()
  if (phase === 'zoneout') set({ zone: zone + 1, phase: 'transition' })
}

resumeFromTransition: () => {
  set({ phase: 'playing' })
}

triggerVictory: () => {
  const { score, highScore, setHighScore } = get()
  if (score > highScore) setHighScore(score)
  set({ phase: 'victory' })
}

goToMenu: () => {
  set({ ...sessionDefaults, phase: 'menu' })
}
```

### Retry / Restart Flow

Clicking **RETRY UPLOAD** on the Game Over screen calls `startGame()` directly — no fade, no countdown, no transition. `startGame()` spreads `sessionDefaults` into the store (full reset: zone 1, health 100, energy 100, ammo 15, score 0, distance 0) and sets `phase: 'playing'`. The `GameCanvas` `<Canvas>` is already mounted and stays mounted. The car start animation (zoom-in from z=22) fires automatically because `PlayerVehicle` detects the `playing` phase transition via `prevPhase` ref.

The exact handler in `GameOver.jsx`:
```jsx
<button onClick={startGame}>
  RETRY UPLOAD
</button>
```

No intermediate screen — instant phase switch to `'playing'`.

### Object Pools

Every moving entity uses a fixed-size object pool to avoid runtime GC pressure:

| Pool | Max slots | Park position | File |
|---|---|---|---|
| Barricades | 7 | z = −500 | `ObstaclePool.jsx` |
| Energy Walls | 4 | z = −500 | `ObstaclePool.jsx` |
| Drones | 6 | z = −600 | `DronePool.jsx` |
| Player bullets | 12 | z = −800 | `BulletPool.jsx` |
| Collectibles | 12 | z = −800 | `CollectiblePool.jsx` |
| Explosions | 8 | — | `ExplosionPool.jsx` |

Inactive slots sit off-screen. Active slots are mutated directly on `useRef` data — no React state updates during gameplay.

### Shared Singletons

Cross-pool data sharing uses plain module-level objects:

- `droneSharedData.slots` — BulletPool reads drone positions for hit detection
- `obstacleSharedData.barricadeSlots / energyWallSlots` — BulletPool reads obstacle positions
- `shakeSignal.pending` — set by `takeDamage`, consumed by `CameraShake`
- `damageSignal.pending` — set by `takeDamage`, consumed by `PlayerVehicle` for red flash
- `inputState.shootPressed` — set by keyboard/touch, consumed by BulletPool in useFrame

### Collision

AABB (Axis-Aligned Bounding Box) on the XZ plane only. Vertical position is not checked — this is what allows jump to clear barricades (barricade collision is gated behind `!isJumping` check, not Y-axis math).

```js
aabbXZ(ax, az, ahx, ahz, bx, bz, bhx, bhz)
```

Half-extents (`HALF` in `physics.js`):

| Entity | Half-X | Half-Z |
|---|---|---|
| Player | 0.55 | 1.1 |
| Drone | 0.55 | 0.55 |
| Bullet | 0.08 | 0.28 |
| Barricade | 0.85 | 0.35 |
| Energy Wall | 0.7 | 0.12 |

Player Z reference: `2` (fixed play position). All obstacles scroll toward the camera (+Z direction).

### Camera

Three camera behaviours in `GameCanvas.jsx`:

1. **`CameraShake`** — triggers on `shakeSignal.pending`; magnitude decays over 0.32 s; base position `{x:0, y:3, z:9}`
2. **`CameraFlyPast`** — fires on entering `'dying'` phase; eases from z=9 to z=-7 over 3 s using `ease = t*t`; calls `completeGameOver()` on completion
3. **`ZoneFog`** — updates Three.js fog color + scene background on zone change

---

## Zone Config (full `zones.js`)

```js
export const ZONES = {
  1: {
    id: 1,
    name: 'Modern Wasteland',
    fogColor: '#5c3d1e',
    bgColor: '#1a0f05',
    ambientColor: '#ff6a00',
    speedMultiplier: 1.0,
    obstacleRate: 3.5,   // seconds between barricade spawns
    droneRate: 6.0,
    droneShoots: false,
    distanceThreshold: 1500,
  },
  2: {
    id: 2,
    name: 'Modern Industrial Complex',
    fogColor: '#1a3320',
    bgColor: '#050f08',
    ambientColor: '#00ff88',
    speedMultiplier: 1.5,
    obstacleRate: 2.5,
    droneRate: 4.0,
    droneShoots: true,
    distanceThreshold: 3500,
  },
  3: {
    id: 3,
    name: 'Modern Core Stronghold',
    fogColor: '#3d0a0a',
    bgColor: '#0f0505',
    ambientColor: '#ff2a2a',
    speedMultiplier: 2.0,
    obstacleRate: 1.8,
    droneRate: 2.5,
    droneShoots: true,
    distanceThreshold: Infinity,
  },
}

export const ZONE_THRESHOLDS = [1500, 3500]
export const BASE_SPEED = 22          // units/second
export const LANES = [-2.5, 0, 2.5]  // left, center, right X positions

export const DAMAGE = {
  obstacle: 20,
  droneBody: 15,
  droneProjectile: 10,  // kept in config but DroneProjectilePool was removed
}
```

Energy wall spawn rate = `obstacleRate × 1.8 + random(0–1)` seconds. Energy walls only spawn in Zone 2+.

---

## Spawn Logic

### Obstacle Spawn (Barricade)

```js
// From ObstaclePool.jsx — BarricadePool
spawnTimer.barricade -= delta
const nearEnd = ZONES[zone].distanceThreshold - distance < 120
if (spawnTimer.barricade <= 0 && !nearEnd) {
  const zoneData = ZONES[zone]
  spawnTimer.barricade = zoneData.obstacleRate + (Math.random() - 0.5) * 0.8
  const slot = data.current.find(s => !s.active)
  if (slot) {
    slot.active = true
    slot.lane   = Math.floor(Math.random() * 3)   // pure random, no lane guarantee
    slot.z      = SPAWN_Z   // -68
    slot.hp     = 2
    if (slot.ref) {
      slot.ref.position.x = LANES[slot.lane]
      slot.ref.position.z = SPAWN_Z
      slot.ref.scale.set(1, 1, 1)
    }
  }
}
```

**There is no guarantee that at least one lane stays clear.** Lane is `Math.floor(Math.random() * 3)` — pure random. Two consecutive obstacles can share a lane or block all three lanes if spawned close together.

### Drone Spawn

```js
// From DronePool.jsx
if (spawnTimer.current <= 0 && !nearEnd) {
  spawnTimer.current = zoneData.droneRate + (Math.random() - 0.5) * 1.0
  const slot = data.current.find((s) => !s.active)
  if (slot) {
    const laneIdx = Math.floor(Math.random() * 3)
    slot.active = true
    slot.lane = laneIdx
    slot.x = LANES[laneIdx]
    slot.targetX = LANES[laneIdx]
    slot.z = SPAWN_Z   // -72
    slot.phase = Math.random() * Math.PI * 2
    slot.sweepTimer = 0.5
    slot.diving = false
    const ref = refs.current[slot.id]
    if (ref) ref.position.set(slot.x, 1.6, SPAWN_Z)
  }
}
```

Drone behavior after spawn:
- **Sweeping** (z > DIVE_Z threshold): drifts between lanes, `SWEEP_AMP = 1.2` units, `SWEEP_SPEED = 1.4` u/s
- **Diving** (z ≤ DIVE_Z threshold): locks onto `playerX`, steers at `DIVE_STEER = 6.0` u/s, keeps tracking player lane during dive

| Zone | Dive triggers at |
|---|---|
| 1 | z = −18 |
| 2 | z = −13 |
| 3 | z = −8 |

### Collectible Spawn

```js
// From CollectiblePool.jsx
function randomType() {
  const r = Math.random()
  if (r < 0.27) return 'energy'   // 27%
  if (r < 0.47) return 'repair'   // 20%
  if (r < 0.61) return 'chip'     // 14%
  if (r < 0.75) return 'ammo'     // 14%
  if (r < 0.88) return 'shield'   // 13%
  return 'boost'                  // 12%
}

// Spawn timer: 3.8s base ± 0.8s random
spawnTimer.current = SPAWN_RATE + (Math.random() - 0.5) * 1.6
// SPAWN_RATE = 3.8
// Stops 120 units before zone threshold (nearEnd check identical to obstacles)
```

---

## Death Animation (full code, `PlayerVehicle.jsx`)

`deathX` is captured the frame the phase first becomes `'dying'`:

```js
if (phase === 'dying' && prevPhase.current !== 'dying') {
  deathX.current = groupRef.current.position.x
}
```

Full crash animation block:

```js
if (phase === 'dying') {
  const prevT = dyingT.current
  dyingT.current += delta
  const raw = dyingT.current

  // Phase 1 (0–0.35s): impact shake — decaying position jitter
  if (raw < 0.35) {
    const shake = 0.4 * (1 - raw / 0.35)
    groupRef.current.position.x = deathX.current + (Math.random() * 2 - 1) * shake
    groupRef.current.position.z = START_Z_TO + (Math.random() * 2 - 1) * shake * 0.4
    groupRef.current.rotation.z = (Math.random() * 2 - 1) * shake * 0.5
  }

  // Trigger blast at 0.3s (fires once on the frame it crosses 0.3s)
  if (prevT < 0.3 && raw >= 0.3) {
    blastData.current = Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
      speed: 1.8 + Math.random() * 2.2,
      rise:  0.8 + Math.random() * 1.4,
      size:  0.25 + Math.random() * 0.35,
    }))
    blastRefs.current.forEach((m) => { if (m) m.visible = true })
    if (smokeRef.current) smokeRef.current.visible = true
  }

  // Animate 6 fireball spheres (0.3s → 1.4s)
  if (raw >= 0.3 && raw < 1.4 && blastData.current.length) {
    const bt = (raw - 0.3) / 1.1   // 0→1 within blast window
    const fade = Math.max(0, 1 - bt)
    blastRefs.current.forEach((m, i) => {
      if (!m) return
      const d = blastData.current[i]
      const dist = d.speed * bt
      m.position.x = Math.cos(d.angle) * dist
      m.position.y = BASE_Y + d.rise * bt * (1 - bt * 0.4)
      m.position.z = Math.sin(d.angle) * dist
      const s = d.size * (0.3 + bt * 1.6)
      m.scale.setScalar(s)
      m.material.opacity = fade * 0.92
      m.visible = fade > 0.01
    })
    // Smoke billow expands and fades
    if (smokeRef.current) {
      smokeRef.current.scale.setScalar(0.3 + bt * 2.8)
      smokeRef.current.material.opacity = Math.max(0, 0.55 * (1 - bt * 0.7))
      smokeRef.current.position.y = BASE_Y + bt * 1.8
    }
  } else if (raw >= 1.4) {
    blastRefs.current.forEach((m) => { if (m) m.visible = false })
    if (smokeRef.current) smokeRef.current.visible = false
  }

  // Phase 2 (0.3s → 1.0s): car rolls sideways, nose lifts — then holds frozen
  if (raw >= 0.3) {
    const rollT = Math.min((raw - 0.3) / 0.7, 1)
    const ease  = 1 - Math.pow(1 - rollT, 2)
    groupRef.current.rotation.z = ease * 1.2     // rolls sideways
    groupRef.current.rotation.x = ease * 0.2     // tail dips, nose lifts
    groupRef.current.position.x = deathX.current // locked to crash lane
    groupRef.current.position.z = START_Z_TO     // locked at z=2
    groupRef.current.position.y = BASE_Y         // stays on road, no clipping
  }
  return
}
```

---

## Start Animation (full code, `PlayerVehicle.jsx`)

```js
// Constants
const START_ANIM_DUR = 1.2   // seconds
const START_Z_FROM   = 22    // behind camera (camera at z≈9)
const START_Z_TO     = 2     // final play position

// Fires when phase transitions to 'playing'
if (phase === 'playing' && prevPhase.current !== 'playing') {
  startT.current = 0
  dyingT.current = 0
  groupRef.current.position.y = BASE_Y
  groupRef.current.position.z = START_Z_FROM
  groupRef.current.rotation.x = 0
  groupRef.current.rotation.z = 0
}

// Animation tick
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
  return  // skip all other movement until car is in position
}
```

This fires on game start **and** on every zone resume (transition → playing), so the car always zooms in from behind camera at the start of each zone.

---

## Level Completion Test (`src/tests/levelCompletionTest.js`)

### How to run

```bash
# Node — no browser or bundler needed (pure JS, no DOM APIs used)
node src/tests/levelCompletionTest.js
```

Also callable from browser console: `runLevelTests()`

### What it tests

Simulates a full run through all three zones using mirrored game constants. For each zone it checks:

1. **Energy** — does the player have enough energy to reach the zone end, accounting for collectible pickups?
2. **Health** — does the player survive expected obstacle and drone hits (assuming 95% obstacle dodge rate, 92% drone dodge rate)?
3. **Density** — is the minimum gap between obstacles (`obstacleRate`) above the minimum reaction time (`0.6 s`)?

Returns `PASS` or `FAIL` per zone, prints full stats, exits with code 0 (all pass) or 1 (any fail).

### Does it assert? Yes.

```js
const pass = energyOk && healthOk && survivable
// ...
if (typeof window === 'undefined') {
  const pass = runLevelTests()
  process.exit(pass ? 0 : 1)
}
```

It is a real test with real assertions — not a stub.

### Note on constant drift

The test file mirrors game constants locally (speed, energy drain rate, collectible weights). If `zones.js` or `gameStore.js` change those values, the test file must be updated manually to stay in sync. Current test constants match the live game as of commit `0af956b`.

---

## Firebase Deploy

- **Project ID:** `ai-uprising-last-escape`
- **Hosting public dir:** `dist/` (Vite build output)
- **Rewrites:** all routes → `/index.html` (SPA routing)
- **Deploy command:** `firebase deploy` (after `npm run build`)
- **Live URL:** `https://ai-uprising-last-escape.web.app`

`firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

---

## File Tree

```
src/
├── App.jsx
├── audio/
│   └── AudioManager.js
├── components/
│   ├── collectibles/
│   │   └── CollectiblePool.jsx
│   ├── combat/
│   │   ├── BulletPool.jsx
│   │   ├── DroneProjectilePool.jsx      ← kept in tree, not mounted in GameCanvas
│   │   └── ExplosionPool.jsx
│   ├── enemies/
│   │   ├── Drone.jsx
│   │   ├── DronePool.jsx
│   │   └── droneData.js
│   ├── environment/
│   │   ├── BuildingPool.jsx
│   │   └── Road.jsx
│   ├── hud/
│   │   └── HUD.jsx
│   ├── obstacles/
│   │   ├── Barricade.jsx
│   │   ├── EnergyWall.jsx
│   │   ├── ObstaclePool.jsx
│   │   └── obstacleData.js
│   └── player/
│       ├── PlayerVehicle.jsx
│       ├── usePlayerInput.js
│       └── useTouchInput.js
├── game/
│   ├── GameCanvas.jsx
│   ├── GameLoop.jsx
│   ├── inputState.js
│   ├── physics.js
│   ├── shakeSignal.js
│   └── zones.js
├── main.jsx
├── screens/
│   ├── GameOver.jsx
│   ├── GameScreen.jsx
│   ├── MainMenu.jsx
│   ├── PauseMenu.jsx
│   ├── Victory.jsx
│   └── ZoneTransition.jsx
├── store/
│   └── gameStore.js
└── tests/
    └── levelCompletionTest.js
```

---

## Project Development History

The game was built incrementally over three weeks, feature by feature.

### Week 1 — Foundation (Mar 24)

**`feat: project scaffold`** `b13d8dc`
Vite + React + Tailwind CSS + PostCSS. All dependencies installed. `src/` directory structure established.

**`feat: game state store`** `5906809`
Zustand store: `phase`, `zone`, `score`, `distance`, `health`, `energy`, `ammo`, `speed`, `playerLane`. Zustand `persist` middleware wires high score to `localStorage` key `aiuprising-v1`.

**`feat: screen routing`** `009cde1`
`App.jsx` routes between screens based on `phase` from the store.

**`feat: main menu and victory screens`** `4a78496`
Initial MainMenu + placeholder Victory screen.

**`feat: game canvas and road`** `a5c55c9`
`GameCanvas.jsx` wraps `<Canvas>`. Two road tiles scroll on Z, recycled to create an infinite road. Camera, fog, ambient/directional lighting configured.

**`feat: player vehicle and controls`** `008b318`
`PlayerVehicle.jsx`: box body, cabin, bumper, four cylinder wheels, emissive headlights. `usePlayerInput` maps keyboard → lane changes, jump. Smooth lane lerp in `useFrame`.

**`feat: core game loop`** `29ee0dd`
`GameLoop.jsx` advances distance and speed per frame, checks zone thresholds, triggers transitions.

**`feat: obstacles and collision`** `30b5758`
`ObstaclePool`: barricades (stacked boxes) and energy walls (glowing planes). AABB XZ collision, −20% health, 1.5 s shared hit cooldown.

### Week 1 (continued) — Enemies & Combat (Mar 25)

**`feat: drones and collision`** `56c6aba`
6-slot `DronePool`. Hover on sine wave, lateral lane sweep. AABB collision −15% health. `droneSharedData` singleton registered.

**`feat: combat system`** `9a26144`
12-slot `BulletPool`. Cyan bolts at 48 u/s. Bullet-drone AABB. Hit → explosion + +100 score. `ExplosionPool` expanding sphere burst.

**`feat: drone projectiles`** `51b5f34`
`DroneProjectilePool` — drones in Zone 2+ fire red bolts. −10% health. (Later removed.)

**`feat: HUD overlay`** `babc7e4`
React DOM overlay: health bar, energy bar, zone badge, score, distance, kill count, ammo, zone progress bar, crosshair.

**`feat: zone transitions`** `3726ac6`
GSAP cinematic: slash bars wipe, zone number pops with chromatic aberration, zone name slides up, auto-resumes after 2.2 s.

**`feat: game over + pause screens`** `aff2cd5`
GameOver: GSAP glitch title, stat breakdown, new-record badge. Pause overlay (`P`/`Esc`).

### Week 2 — Systems & Polish (Mar 25–28)

**`feat: jump mechanics`** `b1e3ab9`
`Space`/`Arrow Up` → sine arc over 0.75 s, `JUMP_HEIGHT = 2.8`. Barricade collision gated behind `!isJumping` check. Slide mechanic also added here but later removed.

**`feat: energy system`** `6020500`
Energy drains at `1.2 + (zone−1) × 0.35` pts/s. Zero = game over. HUD bar pulses yellow at <40%, red at <20%.

**`feat: collectibles`** `f34915d`
12-slot `CollectiblePool`. Six types, random lane, bob + spin animation, GSAP scale-burst on pickup.

**`feat: environment — building pool`** `2179be7`
Procedural box skyscrapers on both road sides. Zone-adaptive colour palettes. Two-tile recycle.

**`feat: audio`** `3893406`
Howler.js singleton `AudioManager.js`. BGM per zone, SFX: shoot, explosion, hit, pickup, game_over, victory.

**`feat: gameplay + graphics overhaul`** `c051d99`
Ammo system. Bullets destroy obstacles (barricade 2-hit, energy wall 1-hit, +50 score). Bloom post-processing. Improved lighting.

**`fix: reduce lag and brightness`** `a2c1106`
One point light per scene, lower bloom intensity, toned emissives — framerate fix on low-end hardware.

**`feat: story overhaul`** `dab7060`
SIGNAL-0 / BLACKOUT Protocol lore. Updated MainMenu + Victory text.

**`feat: shield collectible`** `921edee`
Shield Orb: one-hit absorb, translucent bubble mesh, HUD indicator.

**`feat: speed boost collectible`** `97f1f8f`
Speed Boost: 1.6× speed for 6 s, exhaust flame cones on car rear, HUD countdown.

**`Firebase hosting config`** `89558cd`
`firebase.json` + `.firebaserc` for static hosting of `dist/`.

### Week 3 — Animation & Feel (Apr 10–11)

**`feat: start animation`** `32d16b1`
Car begins at z=22 (behind camera), drives to z=2 over 1.2 s with quadratic ease-out and nose-dip tilt. Fires on every zone resume, not just game start.

**`feat: crash death animation`** `b3e54d4`
Phase 1 (0–0.35 s): decaying position shake. Phase 2 (0.3 s): 6 fireball spheres + smoke billow burst. Phase 3 (0.3–1.0 s): car rolls sideways and nose-lifts. Car frozen at crash lane; camera flies past.

**`fix: crash stays in death lane`** `07aa1cf`
`deathX` ref captures `position.x` the frame death begins; all crash movement locked to that X.

**`fix: car clipping through road`** `5c277fd`
`position.y = BASE_Y` locked during crash, removed nose-down rotation that caused clipping.

**`feat: camera flies past crashed car`** `e25c731`
`CameraFlyPast` eases from z=9 to z=-7 over 3 s (`ease = t*t`). Calls `completeGameOver()` when done. Game over screen only appears after flyby.

**`feat: overhaul animations`** `c3274c6`
ZoneTransition: glitch strobe, scan line, streak lines, chromatic zone number, panel slam.
Victory: energy burst, pulse rings, count-up stats.
GameOver: red flash strobe, chromatic "SIGNAL LOST", periodic glitch, count-up stats.

**`Overall game speed increased`** `67f7bbf`
Base speed 18 → 22 u/s. Zone 2: 33 u/s, Zone 3: 44 u/s.

**`feat: zoneout phase`** `af0dd01`
`'zoneout'` intermediate phase: car drives into fog for 1.5 s, then zone increments and banner fires. Prevents immediate fog colour change.

**`fix: clear static obstacles on zoneout`** `49557c0`
Barricades and energy walls instantly deactivated on zoneout. Drones keep flying, no damage.

**`fix: spawn buffer before zone end`** `a1dec1d`
All spawners stop 120 m before zone threshold.

**`feat: remove drone projectile shooting`** `5a81038`
`DroneProjectilePool` unmounted from `GameCanvas`. Drones deal damage only on body collision.

**`feat: drone kamikaze dive`** `deb66dd`
Drones sweep until zone-specific z threshold, then lock and dive at `DIVE_STEER = 6.0` u/s, continuously tracking player lane during dive.

**`remove slide mechanic`** `0af956b`
Slide removed from store, `PlayerVehicle`, both input hooks, and `ObstaclePool`. Jump is the only evasion.

---

## Design Decisions

**All primitives, no external assets.**
Every mesh is built from Three.js geometry. Lightweight repo, no asset licensing issues for the prototype phase.

**Object pools over dynamic spawning.**
Fixed-size slot arrays. Inactive slots parked off-screen. Zero React component mount/unmount during gameplay, zero GC pressure from spawning.

**No React state in `useFrame`.**
All per-frame mutations write to `useRef` data and Three.js object transforms. Zustand called only for discrete game events (damage, kill, pickup, zone change).

**Shared singletons for cross-pool data.**
Pools register into plain module-level objects. Other pools import the singleton directly — no prop drilling, no store subscriptions inside `useFrame`.

**`zoneout` phase for clean zone boundary.**
Without it, incrementing the zone number immediately changed fog colour while the player was still mid-play. `zoneout` gives the car time to drive into fog, clears the road, then fires the banner.

**`deathX` ref for crash lane fidelity.**
Without capturing the X position at death onset, the car would drift toward center during the crash animation (lane lerp still running). `deathX` freezes position at the exact crash point.
