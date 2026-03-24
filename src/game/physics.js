/**
 * 2D AABB overlap on the X-Z plane (Y is ignored — all objects share the same ground level).
 * Returns true if the two axis-aligned rectangles overlap.
 *
 * @param {number} ax  - center X of object A
 * @param {number} az  - center Z of object A
 * @param {number} ahx - half-width  of object A on X
 * @param {number} ahz - half-depth  of object A on Z
 * @param {number} bx  - center X of object B
 * @param {number} bz  - center Z of object B
 * @param {number} bhx - half-width  of object B on X
 * @param {number} bhz - half-depth  of object B on Z
 */
export function aabbXZ(ax, az, ahx, ahz, bx, bz, bhx, bhz) {
  return Math.abs(ax - bx) < ahx + bhx && Math.abs(az - bz) < ahz + bhz
}

// Half-extents for each entity type (used across obstacle and drone systems)
export const HALF = {
  player:    { x: 0.55, z: 1.1 },
  barricade: { x: 0.75, z: 0.35 },
  energyWall:{ x: 1.0,  z: 0.1 },
  drone:     { x: 0.6,  z: 0.6 },
  bullet:    { x: 0.15, z: 0.15 },
}
