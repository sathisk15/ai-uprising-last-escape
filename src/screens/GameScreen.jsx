import React from 'react'
import useGameStore from '../store/gameStore'
import GameCanvas from '../game/GameCanvas'
import PauseMenu from './PauseMenu'

// Minimal debug HUD — full HUD built in Feature 12
function DebugHUD() {
  const zone = useGameStore((s) => s.zone)
  const score = useGameStore((s) => s.score)
  const distance = useGameStore((s) => s.distance)
  const health = useGameStore((s) => s.health)

  return (
    <div className="absolute top-4 left-4 font-mono text-xs text-white/70 space-y-1 pointer-events-none z-10">
      <p>ZONE {zone} &nbsp;|&nbsp; HP {health}%</p>
      <p>SCORE {Math.floor(score).toLocaleString()}</p>
      <p>DIST &nbsp;{Math.floor(distance)}m</p>
    </div>
  )
}

export default function GameScreen() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="w-full h-full relative">
      <GameCanvas />
      <DebugHUD />
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
