import React from 'react'
import useGameStore from '../store/gameStore'

export default function GameOver() {
  const score = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu = useGameStore((s) => s.goToMenu)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f]">
      <p className="text-[#ff6a00] tracking-widest text-sm mb-2">— STUB —</p>
      <h1 className="text-[#ff2a2a] text-4xl tracking-widest mb-4 font-mono">GAME OVER</h1>
      <p className="text-[#e0e0e0] mb-1">SCORE: {score}</p>
      <p className="text-[#ff6a00] mb-8">BEST: {highScore}</p>
      <div className="flex gap-4">
        <button onClick={startGame} className="border border-[#00f5ff] text-[#00f5ff] px-6 py-2 tracking-widest hover:bg-[#00f5ff] hover:text-black transition-colors">
          RETRY
        </button>
        <button onClick={goToMenu} className="border border-[#555] text-[#aaa] px-6 py-2 tracking-widest hover:bg-[#555] hover:text-white transition-colors">
          MENU
        </button>
      </div>
    </div>
  )
}
