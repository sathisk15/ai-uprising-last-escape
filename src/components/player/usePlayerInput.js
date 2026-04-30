import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'
import { inputState } from '../../game/inputState'
import AudioManager from '../../audio/AudioManager'

// Reads from store directly in the event handler to avoid stale closures.
// Shoot flag is written to inputState (plain object) — read by BulletPool in useFrame.
export default function usePlayerInput() {
  useEffect(() => {
    const onKeyDown = (e) => {
      const { phase, playerLane, setPlayerLane, isJumping } = useGameStore.getState()
      if (phase !== 'playing') return

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          if (playerLane > 0) {
            setPlayerLane(playerLane - 1)
            AudioManager.playSwipe()
          }
          break
        case 'ArrowRight':
        case 'KeyD':
          if (playerLane < 2) {
            setPlayerLane(playerLane + 1)
            AudioManager.playSwipe()
          }
          break
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault()
          if (!isJumping) {
            useGameStore.getState().startJump()
            AudioManager.playJump()
          }
          break
        case 'KeyZ':
        case 'KeyF':
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
