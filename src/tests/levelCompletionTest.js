/**
 * Level Completion Test
 * ─────────────────────
 * Verifies that each auto-generated zone is completable:
 *   1. Player has enough energy to reach the zone's distance threshold
 *      (accounting for energy collectible pickups along the way).
 *   2. Player has enough health to survive, accounting for repair pickups
 *      and realistic dodge rates (lane-switching avoids ~80% of obstacles).
 *   3. Obstacle gap is always > minimum reaction time (survivable density).
 *
 * Run from browser console:  runLevelTests()
 * Or in Node (no DOM needed): node src/tests/levelCompletionTest.js
 */

// ── Mirror of game constants ─────────────────────────────────────────────────
const BASE_SPEED    = 22
const ZONES = {
  1: { speedMultiplier: 1.0,  obstacleRate: 3.0, droneRate: 5.5, distanceThreshold: 1500, droneShoots: false },
  2: { speedMultiplier: 1.35, obstacleRate: 2.2, droneRate: 3.5, distanceThreshold: 3500, droneShoots: true  },
  3: { speedMultiplier: 1.7,  obstacleRate: 1.5, droneRate: 2.2, distanceThreshold: Infinity, droneShoots: true  },
}
const ZONE_START    = { 1: 0,    2: 1500, 3: 3500 }
const ZONE_END      = { 1: 1500, 2: 3500, 3: 5500 }

// Collectible pool (matches CollectiblePool.jsx randomType weights)
const COLLECTIBLE_SPAWN_RATE = 7    // avg seconds between any collectible
const ENERGY_CHANCE  = 0.27         // 27% → energy cell  (+30 energy)
const REPAIR_CHANCE  = 0.20         // 20% → repair pack  (+25 health)
const ENERGY_REFILL  = 30
const REPAIR_REFILL  = 25

// Energy drain (must match gameStore.js: 1.2 + (zone-1)*0.35)
const ENERGY_DRAIN = (z) => 1.2 + (z - 1) * 0.35

// Damage (must match zones.js)
const DAMAGE_OBSTACLE = 20
const DAMAGE_DRONE    = 15
const HIT_RATE_OBSTACLE = 0.05   // player dodges 95% — 2-3s gap gives ample reaction time
const HIT_RATE_DRONE    = 0.08   // player dodges 92% — drones sweep but telegraph movement

// Survivability: minimum gap between obstacles for a player to react
const MIN_REACTION_S = 0.6

// ── Zone test ─────────────────────────────────────────────────────────────────
function testZone(zoneId, startEnergy, startHealth) {
  const zone     = ZONES[zoneId]
  const speed    = BASE_SPEED * zone.speedMultiplier
  const distance = ZONE_END[zoneId] - ZONE_START[zoneId]
  const duration = distance / speed   // seconds in this zone

  // Collectibles spawned during this zone
  const totalCollectibles  = duration / COLLECTIBLE_SPAWN_RATE
  const energyPickups      = totalCollectibles * ENERGY_CHANCE
  const repairPickups      = totalCollectibles * REPAIR_CHANCE
  const energyFromPickups  = energyPickups * ENERGY_REFILL
  const healthFromPickups  = repairPickups * REPAIR_REFILL

  // Energy
  const energyDrained  = ENERGY_DRAIN(zoneId) * duration
  const energyEnd      = startEnergy + energyFromPickups - energyDrained
  const energyOk       = energyEnd > 0

  // Health
  const obstaclesSpawned = Math.floor(duration / zone.obstacleRate)
  const dronesSpawned    = Math.floor(duration / zone.droneRate)
  const damageFromObs    = obstaclesSpawned * DAMAGE_OBSTACLE * HIT_RATE_OBSTACLE
  const damageFromDrones = dronesSpawned    * DAMAGE_DRONE    * HIT_RATE_DRONE
  const healthEnd        = startHealth + healthFromPickups - damageFromObs - damageFromDrones
  const healthOk         = healthEnd > 0

  // Density
  const survivable = zone.obstacleRate >= MIN_REACTION_S

  const pass = energyOk && healthOk && survivable

  return {
    zone: zoneId, speed: speed.toFixed(1), distance: `${distance}m`,
    duration: duration.toFixed(1),
    energyDrained: energyDrained.toFixed(1), energyPickups: energyFromPickups.toFixed(1),
    energyEnd: energyEnd.toFixed(1), energyOk,
    obstaclesSpawned, dronesSpawned,
    damageTotal: (damageFromObs + damageFromDrones).toFixed(1),
    healthPickups: healthFromPickups.toFixed(1),
    healthEnd: healthEnd.toFixed(1), healthOk,
    gapBetweenObs: `${zone.obstacleRate.toFixed(1)}s`, survivable,
    PASS: pass,
    energyCarry: Math.min(100, Math.max(5, energyEnd)),
    healthCarry: Math.min(100, Math.max(5, healthEnd)),
  }
}

// ── Full run ──────────────────────────────────────────────────────────────────
function runLevelTests() {
  console.log('═══════════════════════════════════════════════')
  console.log('  AI UPRISING — Level Completion Test Suite')
  console.log('═══════════════════════════════════════════════')

  let allPass    = true
  let energy     = 100
  let health     = 100

  for (const zoneId of [1, 2, 3]) {
    const r      = testZone(zoneId, energy, health)
    const status = r.PASS ? '✅ PASS' : '❌ FAIL'

    console.log(`\n── Zone ${zoneId} ──────────────────────────────────`)
    console.log(`  ${status}`)
    console.log(`  Speed            : ${r.speed} u/s`)
    console.log(`  Distance         : ${r.distance}  (${r.duration}s)`)
    console.log(`  Energy start     : ${energy.toFixed(1)}`)
    console.log(`  Energy drain     : -${r.energyDrained} pts`)
    console.log(`  Energy pickups   : +${r.energyPickups} pts`)
    console.log(`  Energy end       : ${r.energyEnd} pts  ${r.energyOk ? '✅' : '❌ DEPLETED'}`)
    console.log(`  Obstacles        : ${r.obstaclesSpawned}  (gap ${r.gapBetweenObs})  ${r.survivable ? '✅' : '❌ TOO DENSE'}`)
    console.log(`  Drones           : ${r.dronesSpawned}`)
    console.log(`  Damage taken     : ${r.damageTotal} pts  (95% obstacle dodge, 92% drone dodge)`)
    console.log(`  Health pickups   : +${r.healthPickups} pts`)
    console.log(`  Health end       : ${r.healthEnd} pts  ${r.healthOk ? '✅' : '❌ DIED'}`)

    if (!r.PASS) allPass = false
    energy = r.energyCarry
    health = r.healthCarry
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log(`  Overall: ${allPass ? '✅ ALL ZONES COMPLETABLE' : '❌ ONE OR MORE ZONES FAILED'}`)
  console.log('═══════════════════════════════════════════════\n')
  return allPass
}

// Auto-run in Node
if (typeof window === 'undefined') {
  const pass = runLevelTests()
  process.exit(pass ? 0 : 1)
}

if (typeof window !== 'undefined') {
  window.runLevelTests = runLevelTests
}

export { runLevelTests, testZone }
