// Zone configuration for all 3 zones
export const ZONES = {
  1: {
    id: 1,
    name: 'Modern Wasteland',
    fogColor: '#5c3d1e',
    bgColor: '#1a0f05',
    ambientColor: '#ff6a00',
    speedMultiplier: 1.0,
    obstacleRate: 3.0,   // seconds between spawns
    droneRate: 5.5,
    droneShoots: false,
    distanceThreshold: 1500,
  },
  2: {
    id: 2,
    name: 'Modern Industrial Complex',
    fogColor: '#1a3320',
    bgColor: '#050f08',
    ambientColor: '#00ff88',
    speedMultiplier: 1.35,
    obstacleRate: 2.2,
    droneRate: 3.5,
    droneShoots: true,
    distanceThreshold: 3500,
  },
  3: {
    id: 3,
    name: 'Modern Core Stronghold',
    fogColor: '#3d0a0a',
    bgColor: '#0f0505',
    ambientColor: '#ff2a2a',
    speedMultiplier: 1.7,
    obstacleRate: 1.5,
    droneRate: 2.2,
    droneShoots: true,
    distanceThreshold: Infinity, // ends on completion
  },
}

// Distance milestones to trigger zone transitions
export const ZONE_THRESHOLDS = [1500, 3500]

// Base game speed (units per second)
export const BASE_SPEED = 18

// Lane X positions (left, center, right)
export const LANES = [-2.5, 0, 2.5]

// Damage values (health percentage points)
export const DAMAGE = {
  obstacle: 20,
  droneBody: 15,
  droneProjectile: 10,
}
