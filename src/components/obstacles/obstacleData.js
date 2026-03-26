// Shared obstacle slot arrays — set once on mount by each pool, read by BulletPool
export const obstacleSharedData = {
  barricadeSlots:  null,   // array of { id, active, lane, z, hp, ref }
  energyWallSlots: null,
}
