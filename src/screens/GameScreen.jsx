import React from 'react'
import useGameStore from '../store/gameStore'
import GameCanvas from '../game/GameCanvas'
import HUD from '../components/hud/HUD'
import PauseMenu from './PauseMenu'
import useTouchInput from '../components/player/useTouchInput'

function TouchLayer() {
  useTouchInput()
  return null
}

// Speed lines — radial gradient streaks that intensify per zone
function SpeedLines() {
  const zone = useGameStore((s) => s.zone)
  const phase = useGameStore((s) => s.phase)

  if (phase !== 'playing') return null

  // Zone 1: subtle, Zone 2: medium, Zone 3: intense
  const opacity = zone === 1 ? 0.06 : zone === 2 ? 0.13 : 0.22
  const lineColor = zone === 1 ? '255,106,0' : zone === 2 ? '0,255,136' : '255,30,30'

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `repeating-conic-gradient(
          from 0deg at 50% 52%,
          rgba(${lineColor},${opacity}) 0deg,
          transparent 1.8deg,
          transparent 10deg,
          rgba(${lineColor},${opacity * 0.4}) 10deg,
          transparent 11.5deg,
          transparent 20deg
        )`,
        mixBlendMode: 'screen',
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
      <SpeedLines />
      <HUD />
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
