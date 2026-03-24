import React from 'react'
import useGameStore from '../store/gameStore'
import GameCanvas from '../game/GameCanvas'
import PauseMenu from './PauseMenu'

export default function GameScreen() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="w-full h-full relative">
      {/* 3D world */}
      <GameCanvas />

      {/* Pause overlay */}
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
