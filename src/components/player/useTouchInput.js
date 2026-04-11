import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'
import { inputState } from '../../game/inputState'

const SWIPE_THRESHOLD = 40  // px for lane/jump/slide
const TAP_THRESHOLD   = 10  // px — movement smaller than this = tap (shoot)

export default function useTouchInput() {
  useEffect(() => {
    let startX = 0
    let startY = 0

    function onTouchStart(e) {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
    }

    function onTouchEnd(e) {
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      const { phase, setPlayerLane, playerLane, startJump } = useGameStore.getState()
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
          setPlayerLane(playerLane + (dx > 0 ? 1 : -1))
        }
      } else {
        // Vertical swipe
        if (dy < -SWIPE_THRESHOLD) startJump()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])
}
