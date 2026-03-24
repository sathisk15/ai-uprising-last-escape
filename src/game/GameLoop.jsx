import { useFrame } from '@react-three/fiber'
import useGameStore from '../store/gameStore'

/**
 * Master game ticker — lives inside the R3F Canvas.
 * Calls advanceDistance every frame, which updates:
 *   distance, score, speed, and triggers zone transitions / victory.
 * All other systems (Road, obstacles, drones) read speed from the store.
 */
export default function GameLoop() {
  useFrame((_, delta) => {
    const { phase, advanceDistance } = useGameStore.getState()
    if (phase !== 'playing') return

    // Clamp delta so a browser tab-switch spike doesn't teleport the game
    const safeDelta = Math.min(delta, 0.1)
    advanceDistance(safeDelta)
  })

  return null
}
