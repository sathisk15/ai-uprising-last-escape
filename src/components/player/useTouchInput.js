import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'
import { inputState } from '../../game/inputState'
import AudioManager from '../../audio/AudioManager'

const SWIPE_THRESHOLD = 40  // px for lane/jump
const TAP_THRESHOLD   = 10  // px — movement smaller than this = tap (shoot)

export default function useTouchInput() {
  useEffect(() => {
    let startX = 0
    let startY = 0

    function onTouchStart(e) {
      e.preventDefault()   // blocks pull-to-refresh and page scroll
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
    }

    function onTouchMove(e) {
      e.preventDefault()   // blocks scroll while finger is moving
    }

    function onTouchEnd(e) {
      e.preventDefault()
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      const { phase, setPlayerLane, playerLane, startJump, isJumping } = useGameStore.getState()
      if (phase !== 'playing') return

      // Tap — shoot
      if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD) {
        inputState.shootPressed = true
        return
      }

      // Dominant axis
      if (absDx > absDy) {
        // Horizontal swipe — lane change
        if (absDx >= SWIPE_THRESHOLD) {
          const dir = dx > 0 ? 1 : -1
          const newLane = playerLane + dir
          if (newLane >= 0 && newLane <= 2) {
            setPlayerLane(newLane)
            AudioManager.playSwipe()
          }
        }
      } else {
        // Vertical swipe up — jump
        if (dy < -SWIPE_THRESHOLD && !isJumping) {
          startJump()
          AudioManager.playJump()
        }
      }
    }

    // passive: false is required to allow preventDefault()
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd,   { passive: false })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])
}
