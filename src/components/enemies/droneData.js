// Singleton: DronePool registers its slot array here on mount so
// BulletPool can read active drone positions for collision without prop drilling.
export const droneSharedData = { slots: null }
