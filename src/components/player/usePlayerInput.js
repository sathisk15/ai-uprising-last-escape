import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'

// Reads from store directly in the event handler to avoid stale closures.
// A separate shoot flag is written to the store for Feature 10 (combat).
export default function usePlayerInput() {
  useEffect(() => {
    const onKeyDown = (e) => {
      const { phase, playerLane, setPlayerLane } = useGameStore.getState()
      if (phase !== 'playing') return

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          setPlayerLane(playerLane - 1)
          break
        case 'ArrowRight':
        case 'KeyD':
          setPlayerLane(playerLane + 1)
          break
        // Space / shoot wired in Feature 10
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // empty — reads live state from store, no stale closures
}
