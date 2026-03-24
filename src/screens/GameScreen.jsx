import React from 'react'
import useGameStore from '../store/gameStore'
import PauseMenu from './PauseMenu'

// Placeholder — GameCanvas + HUD will be added in Features 5–12
export default function GameScreen() {
  const phase = useGameStore((s) => s.phase)
  const zone = useGameStore((s) => s.zone)
  const health = useGameStore((s) => s.health)
  const score = useGameStore((s) => s.score)
  const distance = useGameStore((s) => s.distance)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const takeDamage = useGameStore((s) => s.takeDamage)
  const endGame = useGameStore((s) => s.endGame)
  const triggerVictory = useGameStore((s) => s.triggerVictory)

  return (
    <div className="w-full h-full relative bg-[#1a0f05] flex flex-col items-center justify-center">
      {/* Stub game area */}
      <p className="text-[#ff6a00] tracking-widest text-sm mb-4">— GAME CANVAS STUB —</p>
      <div className="text-[#e0e0e0] font-mono space-y-2 text-center">
        <p>Zone: {zone} | Health: {health}% | Score: {score}</p>
        <p>Distance: {Math.floor(distance)}</p>
      </div>

      {/* Temp test buttons */}
      <div className="flex gap-3 mt-8 flex-wrap justify-center">
        <button onClick={pauseGame} className="border border-[#00f5ff] text-[#00f5ff] px-4 py-2 text-sm">PAUSE</button>
        <button onClick={() => takeDamage('obstacle')} className="border border-[#ff6a00] text-[#ff6a00] px-4 py-2 text-sm">HIT −20%</button>
        <button onClick={() => takeDamage('droneBody')} className="border border-[#ff6a00] text-[#ff6a00] px-4 py-2 text-sm">HIT −15%</button>
        <button onClick={() => takeDamage('droneProjectile')} className="border border-[#ff6a00] text-[#ff6a00] px-4 py-2 text-sm">HIT −10%</button>
        <button onClick={endGame} className="border border-[#ff2a2a] text-[#ff2a2a] px-4 py-2 text-sm">FORCE OVER</button>
        <button onClick={triggerVictory} className="border border-[#00ff88] text-[#00ff88] px-4 py-2 text-sm">FORCE WIN</button>
      </div>

      {/* Pause overlay */}
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
