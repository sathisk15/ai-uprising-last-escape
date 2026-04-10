import { useEffect, useRef } from 'react'
import useGameStore from '../store/gameStore'
import GameCanvas from '../game/GameCanvas'
import HUD from '../components/hud/HUD'
import PauseMenu from './PauseMenu'
import useTouchInput from '../components/player/useTouchInput'
import { damageSignal } from '../game/shakeSignal'

function TouchLayer() {
  useTouchInput()
  return null
}

// Red vignette flash on every hit — reads damageSignal each frame via rAF
function DamageFlash() {
  const overlayRef = useRef(null)
  const animRef    = useRef(null)
  const flashT     = useRef(0)

  useEffect(() => {
    const DURATION = 0.35  // seconds

    let last = performance.now()
    function tick(now) {
      const delta = (now - last) / 1000
      last = now

      if (damageSignal.pending) {
        damageSignal.pending = false
        flashT.current = DURATION
      }

      if (flashT.current > 0) {
        flashT.current -= delta
        const opacity = Math.max(0, flashT.current / DURATION) * 0.55
        if (overlayRef.current) overlayRef.current.style.opacity = opacity
      } else if (overlayRef.current) {
        overlayRef.current.style.opacity = 0
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        opacity: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, #ff000099 100%)',
        transition: 'opacity 0.05s',
      }}
    />
  )
}


export default function GameScreen() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="w-full h-full relative">
      <TouchLayer />
      <GameCanvas />
      <HUD />
      <DamageFlash />
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
