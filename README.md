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
| Deploy | Firebase Hosting |

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

| Zone | Name | Speed | Enemies |
|---|---|---|---|
| 1 | Modern Wasteland | 22 u/s | Barricades, slow drones |
| 2 | Industrial Complex | 33 u/s | Energy walls, faster drones |
| 3 | Core Stronghold | 44 u/s | Dense obstacles, aggressive drone swarm |

Each zone ends with a **zoneout** — the car drives forward into fog, the road clears, then the zone banner slams in. Zone 3 completion triggers the **Victory** screen.

### Resources

- **Health** (100%) — lost on obstacle and drone collision. Zero = game over.
- **Energy** — drains continuously per zone rate. Zero = game over.
- **Ammo** — finite; pick up ammo crates to resupply.

### Collectibles

| Item | Visual | Effect |
|---|---|---|
| Energy Cell | Blue sphere + ring | +30 energy |
| Repair Pack | Green cross | +25 health |
| Data Chip | Cyan flat chip | +150 score |
| Ammo Crate | Brown box with bullets | +8 ammo |
| Shield Orb | Purple octahedron | One-hit absorb |
| Speed Boost | Orange chevron | 1.6× speed for 6 s |

### Scoring

- Distance driven contributes continuously
- Drone kill: +100 score
- Data Chip pickup: +150 score
- Obstacle destroyed by bullet: +50 score
- High score persists in `localStorage`

---

## Architecture

### State Machine (`gameStore.js`)

```
menu → playing → zoneout → transition → playing (next zone)
                         ↘ victory (zone 3 complete)
playing → dying → gameover
playing → paused → playing
```

- **`zoneout`** — intermediate phase where the car drives into fog and the road clears before the zone banner appears
- **`dying`** — crash animation plays; camera flies past the wreck; then transitions to `gameover`

### Object Pools

Every moving entity uses a fixed-size object pool to avoid runtime garbage collection:

| Pool | Max slots | File |
|---|---|---|
| Obstacles (barricade + energy wall) | 10 each | `ObstaclePool.jsx` |
| Drones | 6 | `DronePool.jsx` |
| Player bullets | 12 | `BulletPool.jsx` |
| Collectibles | 12 | `CollectiblePool.jsx` |
| Explosions | 8 | `ExplosionPool.jsx` |

Inactive slots sit at `z = -800` (off-screen parking). Active slots are moved by `useFrame` each tick — no React state updates during gameplay.

### Shared Singletons

Cross-pool collision and data sharing is done through plain module-level objects to avoid prop drilling:

- `droneSharedData.slots` — BulletPool reads drone positions for hit detection
- `obstacleSharedData.barricadeSlots / energyWallSlots` — BulletPool reads obstacle positions
- `shakeSignal.pending` — set by `takeDamage`, consumed by `CameraShake` in GameCanvas
- `inputState.shootPressed` — set by keyboard/touch, consumed by BulletPool in useFrame

### Collision

AABB (Axis-Aligned Bounding Box) on the XZ plane only — vertical position is not checked, which allows the jump mechanic to clear obstacles without 3D overlap math.

```js
// physics.js
aabbXZ(ax, az, ahx, ahz, bx, bz, bhx, bhz)
```

Half-extents for each entity are defined in `HALF` (physics.js):

| Entity | Half-X | Half-Z |
|---|---|---|
| Player | 0.55 | 1.1 |
| Drone | 0.55 | 0.55 |
| Bullet | 0.08 | 0.28 |
| Barricade | 0.85 | 0.35 |
| Energy Wall | 0.7 | 0.12 |

### Camera

Three camera behaviours stack in `GameCanvas.jsx`:

1. **`CameraShake`** — triggered by `shakeSignal.pending`; decays over 0.32 s
2. **`CameraFlyPast`** — activates on `'dying'` phase; eases forward from z=9 to z=-7 over 3 s, then calls `completeGameOver()`
3. **`ZoneFog`** — updates Three.js fog colour and scene background when zone changes

---

## Project Development History

The game was built incrementally over three weeks, feature by feature. Each section below corresponds to one or more commits.

### Week 1 — Foundation (Mar 24)

**`feat: project scaffold`** `b13d8dc`
Set up the Vite + React project with Tailwind CSS, PostCSS, and all dependencies. Established the `src/` directory structure.

**`feat: game state store`** `5906809`
Zustand store with the full session state: `phase`, `zone`, `score`, `distance`, `health`, `energy`, `ammo`, `speed`, `playerLane`. Zustand `persist` middleware wires high score to `localStorage`.

**`feat: screen routing`** `009cde1`
`App.jsx` routes between phases — MainMenu, GameScreen, ZoneTransition, GameOver, Victory, PauseMenu — based on the `phase` field in the store.

**`feat: main menu and victory screens`** `4a78496`
Initial MainMenu with lore text and start button. Placeholder Victory screen.

**`feat: game canvas and road`** `a5c55c9`
`GameCanvas.jsx` wraps the Three.js `<Canvas>`. Two road tiles scroll on Z, recycled when they pass the camera — infinite road illusion. Camera, fog, and ambient/directional lighting set up.

**`feat: player vehicle and controls`** `008b318`
`PlayerVehicle.jsx` built from primitives: box body, cabin, bumper, four cylinder wheels, emissive headlights. `usePlayerInput` hook maps keyboard to lane changes and jump. Smooth lane lerp in `useFrame`.

**`feat: core game loop`** `29ee0dd`
`GameLoop.jsx` advances `distance` and `speed` per frame, checks zone thresholds (1500 m / 3500 m), and triggers zone transitions.

**`feat: obstacles and collision`** `30b5758`
`ObstaclePool` with barricades (stacked boxes) and energy walls (glowing planes). AABB collision on XZ plane: −20% health per hit with a 1.5 s shared hit cooldown so double-hits can't stack.

### Week 1 (continued) — Enemies & Combat (Mar 25)

**`feat: drones and collision`** `56c6aba`
`DronePool` with 6 pooled drones. Each drone hovers (sine wave on Y) and sweeps laterally between lanes. AABB player collision deals −15% health. `droneSharedData` singleton shares slot array with BulletPool.

**`feat: combat system`** `9a26144`
`BulletPool` (12 slots). Player fires cyan bolts with `Z`/`F`. Bullets travel forward at 48 u/s, checked against drones via AABB. Hit → explosion spawned, drone deactivated, +100 score. `ExplosionPool` plays expanding sphere bursts.

**`feat: drone projectiles`** `51b5f34`
Drones in Zone 2+ fire red bolts at the player. Separate `DroneProjectilePool` with per-drone fire rate. AABB collision deals −10% health.

**`feat: HUD overlay`** `babc7e4`
React DOM overlay (pointer-events: none) with health bar, energy bar, zone badge, score, distance, kill count, ammo counter, zone progress bar, and centre crosshair.

**`feat: zone transitions`** `3726ac6`
GSAP cinematic sequence: slash bars wipe from edges, zone number pops in with chromatic aberration, zone name slides up, auto-resumes after 2.2 s.

**`feat: game over + pause screens`** `aff2cd5`
GameOver screen with GSAP glitch title, stat breakdown, new-record badge. Pause overlay (`P`/`Esc`) with resume/menu options.

### Week 2 — Systems & Polish (Mar 25–28)

**`feat: jump mechanics`** `b1e3ab9`
Jump: `Space`/`Arrow Up` triggers a sine arc over 0.7 s. During the arc, AABB Y-check is skipped, so the car clears road-level barricades. Slide was also added here but later removed.

**`feat: energy system`** `6020500`
Energy bar drains continuously (rate scales per zone). Reaching 0 triggers game over. HUD bar pulses yellow below 40%, red below 20%.

**`feat: collectibles`** `f34915d`
`CollectiblePool` with 12 slots. Six collectible types spawn at random lanes, bob and spin in place, trigger GSAP scale-burst on pickup. Audio plays on collection.

**`feat: environment — building pool`** `2179be7`
`BuildingPool` renders procedural box skyscrapers on both road sides. Buildings change colour palette per zone, two-tile recycle identical to road.

**`feat: audio`** `3893406`
`AudioManager.js` (Howler.js singleton): BGM loops per zone, SFX for shoot, explosion, hit, pickup, game_over, victory.

**`feat: gameplay + graphics overhaul`** `c051d99`
Ammo system added (finite bullets, refillable). Bullets can now destroy obstacles (barricade 2-hit, energy wall 1-hit) for +50 score. Bloom post-processing via `@react-three/postprocessing`. Improved road texture, vehicle shading, and lighting setup.

**`fix: reduce lag and brightness`** `a2c1106`
Reduced point light count to one per scene, lowered bloom intensity, toned emissive values — addressed framerate drop on lower-end hardware.

**`feat: story overhaul`** `dab7060`
Rewrote in-game lore: SIGNAL-0 mobile upload narrative, BLACKOUT Protocol plot. Updated MainMenu and Victory screen text.

**`feat: shield collectible`** `921edee`
Shield Orb pickup: one-hit absorb with translucent bubble mesh around the car and HUD indicator.

**`feat: speed boost collectible`** `97f1f8f`
Speed Boost pickup: 1.6× speed for 6 s with exhaust flame mesh on car rear and HUD countdown timer.

**`Firebase hosting config`** `89558cd`
Configured `firebase.json` for static hosting of the Vite build output.

### Week 3 — Animation & Feel (Apr 10–11)

**`feat: start animation`** `32d16b1`
On game start, the car begins at z=22 (behind camera) and drives into position at z=2 over 1.2 s with a quadratic ease-out and a nose-dip tilt effect.

**`feat: crash death animation`** `b3e54d4`
On health reaching 0: Phase 1 — car shakes for 0.3 s. Phase 2 — 6 fireball spheres and a smoke billow burst outward. Phase 3 — car rolls sideways (`rotation.z`) and nose-lifts (`rotation.x`). Car stays frozen at the crash lane.

**`fix: crash stays in death lane`** `07aa1cf`
Captured `deathX` at the moment of death onset; crash animation plays at that fixed X position regardless of input after death.

**`fix: car clipping through road`** `5c277fd`
Locked `position.y = BASE_Y` during crash and removed downward rotation that pushed the car nose into the road geometry.

**`feat: camera flies past crashed car`** `e25c731`
`CameraFlyPast` component: on entering `'dying'` phase, camera eases forward from z=9 to z=-7 over 3 s (ease-in curve), then calls `completeGameOver()`. The game over screen appears only after the flyby completes.

**`feat: overhaul animations — zone transition, victory, game over`** `c3274c6`
- **ZoneTransition**: glitch strobe, scan line sweep, streak lines, chromatic zone number, panel retract/slam animation
- **Victory**: energy burst rings, pulse circles, count-up stats
- **GameOver**: red flash strobe, chromatic "SIGNAL LOST" text, periodic glitch pulses, count-up stats

**`Overall game speed increased`** `67f7bbf`
Base speed raised from 18 to 22 u/s. Zone 2 → 33 u/s, Zone 3 → 44 u/s. Game felt too slow in early zones.

**`feat: zoneout phase`** `af0dd01`
Added `'zoneout'` as an intermediate phase between `'playing'` and `'transition'`. During zoneout: car drives forward into fog, new spawns stop, road and buildings keep scrolling. After 1.5 s, zone increments and the transition banner fires. This prevents the fog colour changing immediately when the zone ends.

**`fix: clear static obstacles on zoneout`** `49557c0`
Barricades and energy walls are instantly deactivated when zoneout starts so the road is clear before the camera pulls away. Drones keep flying for dynamic feel but deal no damage.

**`fix: spawn buffer before zone end`** `a1dec1d`
Obstacles, drones, and collectibles stop spawning 120 units before the zone distance threshold, ensuring the road is naturally clear by the time zoneout triggers.

**`feat: remove drone projectile shooting`** `5a81038`
`DroneProjectilePool` removed entirely. Drones now only deal damage on body collision — simpler and less punishing.

**`feat: drone kamikaze dive`** `deb66dd`
Drones sweep laterally during approach. Once within a zone-specific Z threshold, they lock onto the player's lane and dive hard (`DIVE_STEER = 6.0`). Threshold tightens each zone — less warning time:

| Zone | Dive triggers at |
|---|---|
| 1 | z = −18 |
| 2 | z = −13 |
| 3 | z = −8 |

**`remove slide mechanic`** `0af956b`
Slide (ArrowDown/swipe-down squish) removed from all files: store, `PlayerVehicle`, `usePlayerInput`, `useTouchInput`, `ObstaclePool`. Jump is the only evasion mechanic.

---

## File Structure

```
src/
├── App.jsx                          # Phase-based screen routing
├── main.jsx
├── index.css
├── store/
│   └── gameStore.js                 # Zustand — all state + actions
├── game/
│   ├── GameCanvas.jsx               # <Canvas>, camera, lighting, post-processing
│   ├── GameLoop.jsx                 # useFrame master ticker — distance, speed, zone checks
│   ├── physics.js                   # aabbXZ helper + HALF extents
│   ├── zones.js                     # Zone configs (speed, colors, spawn rates, thresholds)
│   ├── inputState.js                # Plain object: shootPressed flag
│   └── shakeSignal.js               # Plain object: pending flag for camera shake
├── screens/
│   ├── MainMenu.jsx
│   ├── GameScreen.jsx
│   ├── ZoneTransition.jsx
│   ├── GameOver.jsx
│   ├── Victory.jsx
│   └── PauseMenu.jsx
├── components/
│   ├── player/
│   │   ├── PlayerVehicle.jsx        # Car mesh + all animations (start, jump, crash, zoneout)
│   │   ├── usePlayerInput.js        # Keyboard → lane/jump/shoot
│   │   └── useTouchInput.js         # Touch swipe → lane/jump/shoot
│   ├── environment/
│   │   ├── Road.jsx                 # 2-tile scrolling road
│   │   └── BuildingPool.jsx         # Procedural side buildings, zone-adaptive colours
│   ├── obstacles/
│   │   ├── ObstaclePool.jsx         # Barricade + energy wall pool, spawn logic, collision
│   │   ├── Barricade.jsx
│   │   ├── EnergyWall.jsx
│   │   └── obstacleData.js          # Shared singleton for BulletPool cross-collision
│   ├── enemies/
│   │   ├── DronePool.jsx            # Drone pool, hover, sweep, kamikaze dive, collision
│   │   ├── Drone.jsx                # Drone mesh (sphere body + box wings)
│   │   └── droneData.js             # Shared singleton for BulletPool cross-collision
│   ├── combat/
│   │   ├── BulletPool.jsx           # Player bullets, fire rate, drone + obstacle collision
│   │   └── ExplosionPool.jsx        # Expanding sphere burst effect
│   ├── collectibles/
│   │   └── CollectiblePool.jsx      # All 6 collectible types, bob/spin, pickup detection
│   └── hud/
│       └── HUD.jsx                  # React DOM overlay
├── audio/
│   └── AudioManager.js              # Howler.js singleton
└── tests/
    └── levelCompletionTest.js
```

---

## Design Decisions

**All primitives, no external assets.**
Every mesh is built from Three.js geometry. This keeps the repository lightweight and avoids asset licensing issues for the prototype phase.

**Object pools over dynamic spawning.**
All enemies, bullets, obstacles, and collectibles use fixed-size arrays. Slots are parked off-screen at z=−800 when inactive. This eliminates React component mount/unmount churn and GC pressure during gameplay.

**No React state in `useFrame`.**
All per-frame mutations write directly to `useRef` data and Three.js object positions/rotations. Zustand is only called for discrete game events (damage, kill, pickup, zone change) — never for position or animation.

**Shared singletons for cross-pool data.**
Rather than prop-drilling slot arrays or using a global store subscription inside `useFrame`, pools register themselves into plain module-level objects (`droneSharedData`, `obstacleSharedData`, `shakeSignal`). Any pool that needs to read another pool's data imports the singleton directly.

**`zoneout` phase for clean zone boundary.**
Without the intermediate `zoneout` phase, incrementing the zone number immediately changed the fog colour and spawned the zone banner while the player was still mid-play. The `zoneout` phase gives the car time to drive into fog, clears the road, and only then increments the zone.
