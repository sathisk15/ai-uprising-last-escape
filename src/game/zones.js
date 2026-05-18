// Zone configuration for all 3 zones — unified night city theme
export const ZONES = {
  0: {
    id: 0,
    name: 'TRAINING GROUND',
    fogColor: '#0a0c12',
    bgColor: '#05060d',
    ambientColor: '#1a2a4a',
    speedMultiplier: 1.0,
    obstacleRate: 9999,
    droneRate: 9999,
    droneShoots: false,
    distanceThreshold: 99999,
  },
  1: {
    id: 1,
    name: 'Modern Wasteland',
    fogColor: '#0a0c12',
    bgColor: '#05060d',
    ambientColor: '#1a2a4a',
    speedMultiplier: 1.0,
    obstacleRate: 3.5,
    droneRate: 6.0,
    droneShoots: false,
    distanceThreshold: 1500,
  },
  2: {
    id: 2,
    name: 'Modern Industrial Complex',
    fogColor: '#0a0c12',
    bgColor: '#05060d',
    ambientColor: '#1a2a4a',
    speedMultiplier: 1.5,
    obstacleRate: 2.5,
    droneRate: 4.0,
    droneShoots: true,
    distanceThreshold: 3500,
  },
  3: {
    id: 3,
    name: 'Modern Core Stronghold',
    fogColor: '#0a0c12',
    bgColor: '#05060d',
    ambientColor: '#1a2a4a',
    speedMultiplier: 2.0,
    obstacleRate: 1.8,
    droneRate: 2.5,
    droneShoots: true,
    distanceThreshold: Infinity,
  },
}

// Distance milestones to trigger zone transitions
export const ZONE_THRESHOLDS = [1500, 3500]

// Base game speed (units per second)
export const BASE_SPEED = 22

// Lane X positions (left, center, right)
export const LANES = [-2.5, 0, 2.5]

// Damage values (health percentage points)
export const DAMAGE = {
  obstacle: 20,
  droneBody: 15,
  droneProjectile: 10,
}
