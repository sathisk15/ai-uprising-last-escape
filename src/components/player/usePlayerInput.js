import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'
import { inputState } from '../../game/inputState'

// Reads from store directly in the event handler to avoid stale closures.
// Shoot flag is written to inputState (plain object) — read by BulletPool in useFrame.
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
        case 'Space':
          e.preventDefault()
          inputState.shootPressed = true
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
