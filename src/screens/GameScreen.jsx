import React from 'react'
import useGameStore from '../store/gameStore'
import GameCanvas from '../game/GameCanvas'
import HUD from '../components/hud/HUD'
import PauseMenu from './PauseMenu'

export default function GameScreen() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="w-full h-full relative">
      <GameCanvas />
      <HUD />
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
