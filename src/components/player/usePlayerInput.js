import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'
import { inputState } from '../../game/inputState'
import AudioManager from '../../audio/AudioManager'

// Reads from store directly in the event handler to avoid stale closures.
// Shoot flag is written to inputState (plain object) — read by BulletPool in useFrame.
export default function usePlayerInput() {
  useEffect(() => {
    const onKeyDown = (e) => {
      const { phase, playerLane, setPlayerLane, isJumping, zone, tutorialFrozen, tutorialStep } = useGameStore.getState()
      if (phase !== 'playing') return

      // In zone 0 (tutorial): block ALL input unless frozen and it matches the current step
      if (zone === 0) {
        if (!tutorialFrozen) return   // free-run period — no player control
        if (tutorialStep === 2) {
          const isShoot = e.code === 'KeyZ' || e.code === 'KeyF'
          if (!isShoot) return
        } else if (tutorialStep === 1) {
          const isJump = e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space'
          if (!isJump) return
        } else if (tutorialStep === 0) {
          const isRight = e.code === 'ArrowRight' || e.code === 'KeyD'
          const isLeft  = e.code === 'ArrowLeft'  || e.code === 'KeyA'
          const isLaneHoriz = isRight || isLeft
          if (!isLaneHoriz) return
          // From center: either direction OK. From left lane (0): only right. From right (2): only left.
          if (playerLane === 1) {
            // OK
          } else if (playerLane === 0) {
            if (!isRight) return
          } else if (playerLane === 2) {
            if (!isLeft) return
          }
        }
      }

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
