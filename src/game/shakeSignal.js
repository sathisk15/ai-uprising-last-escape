// Module-level flag — set from store takeDamage, read + cleared in CameraShake useFrame
export const shakeSignal  = { pending: false }

// Separate flag for car + screen damage flash (not consumed by CameraShake)
export const damageSignal = { pending: false }
