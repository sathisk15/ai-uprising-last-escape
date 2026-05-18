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

      const { phase, setPlayerLane, playerLane, startJump, isJumping, zone, tutorialFrozen, tutorialStep } = useGameStore.getState()
      if (phase !== 'playing') return

      const isTap        = absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD
      const isHorizSwipe = !isTap && absDx > absDy && absDx >= SWIPE_THRESHOLD
      const isUpSwipe    = !isTap && absDy >= absDx && dy < -SWIPE_THRESHOLD

      // In zone 0 (tutorial): block ALL touch unless frozen and it matches the current step
      if (zone === 0) {
        if (!tutorialFrozen) return   // free-run period — no player control
        if (tutorialStep === 2 && !isTap) return
        if (tutorialStep === 1 && !isUpSwipe) return
        if (tutorialStep === 0) {
          if (!isHorizSwipe) return
          const dir = dx > 0 ? 1 : -1
          if (playerLane === 1) {
            // either direction OK
          } else if (playerLane === 0) {
            if (dir !== 1) return
          } else if (playerLane === 2) {
            if (dir !== -1) return
          }
        }
      }

      // Tap — shoot
      if (isTap) {
        inputState.shootPressed = true
        return
      }

      // Dominant axis
      if (isHorizSwipe) {
        const dir = dx > 0 ? 1 : -1
        const newLane = playerLane + dir
        if (newLane >= 0 && newLane <= 2) {
          setPlayerLane(newLane)
          AudioManager.playSwipe()
        }
      } else if (isUpSwipe) {
        if (!isJumping) {
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
