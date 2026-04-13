import { useEffect, useRef } from 'react'
import useGameStore from '../store/gameStore'

// Orange edge vignette + horizontal speed lines during boost
function SpeedVignette() {
  const overlayRef   = useRef(null)
  const linesRef     = useRef(null)
  const animRef      = useRef(null)
  const opacityT     = useRef(0)   // 0..1 current opacity

  useEffect(() => {
    let last = performance.now()
    function tick(now) {
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now

      const { speedBoostActive } = useGameStore.getState()
      const target = speedBoostActive ? 1 : 0
      opacityT.current += (target - opacityT.current) * Math.min(delta * 8, 1)
      const t = opacityT.current

      if (overlayRef.current) overlayRef.current.style.opacity = t
      if (linesRef.current)   linesRef.current.style.opacity   = t * 0.55

      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <>
      {/* Orange vignette border */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          opacity: 0,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(255,100,0,0.30) 80%, rgba(255,60,0,0.55) 100%)',
        }}
      />
      {/* Horizontal speed-line streaks */}
      <div
        ref={linesRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          opacity: 0,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 5px,
              rgba(255,180,60,0.06) 5px,
              rgba(255,180,60,0.06) 6px
            )
          `,
        }}
      />
    </>
  )
}
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
      <SpeedVignette />
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
