import { useEffect } from 'react'
import useGameStore from '../../store/gameStore'
import { inputState } from '../../game/inputState'
import AudioManager from '../../audio/AudioManager'

const SWIPE_THRESHOLD = 40  // px for lane/jump
const TAP_THRESHOLD   = 10  // px — movement smaller than this = tap (shoot)

function isGameUiTouchTarget(el) {
  return el && typeof el.closest === 'function' && el.closest('[data-game-ui-touch]')
}

export default function useTouchInput(active = true) {
  useEffect(() => {
    if (!active) return

    let startX = 0
    let startY = 0
    /** iOS: preventDefault(touchstart) blocks synthetic click on buttons — exempt UI taps */
    let touchStartedOnGameUi = false

    function onTouchStart(e) {
      touchStartedOnGameUi = !!isGameUiTouchTarget(e.target)
      const t = e.touches[0]
      if (t) {
        startX = t.clientX
        startY = t.clientY
      }
      if (touchStartedOnGameUi) return
      e.preventDefault()
    }

    function onTouchMove(e) {
      if (touchStartedOnGameUi) return
      e.preventDefault()
    }

    function onTouchEnd(e) {
      try {
        if (touchStartedOnGameUi || isGameUiTouchTarget(e.target))
          return
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

        if (zone === 0) {
          if (!tutorialFrozen) return
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

        if (isTap) {
          inputState.shootPressed = true
          return
        }

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
      } finally {
        touchStartedOnGameUi = false
      }
    }

    const onTouchCancel = () => {
      touchStartedOnGameUi = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd,   { passive: false })
    window.addEventListener('touchcancel', onTouchCancel)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [active])
}
