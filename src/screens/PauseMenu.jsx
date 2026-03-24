import React from 'react'
import useGameStore from '../store/gameStore'

export default function PauseMenu() {
  const resumeGame = useGameStore((s) => s.resumeGame)
  const goToMenu = useGameStore((s) => s.goToMenu)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
      <h1 className="text-[#00f5ff] text-3xl tracking-widest mb-8 font-mono">PAUSED</h1>
      <div className="flex flex-col gap-4">
        <button onClick={resumeGame} className="border border-[#00f5ff] text-[#00f5ff] px-8 py-3 tracking-widest hover:bg-[#00f5ff] hover:text-black transition-colors">
          RESUME
        </button>
        <button onClick={goToMenu} className="border border-[#555] text-[#aaa] px-8 py-3 tracking-widest hover:bg-[#555] hover:text-white transition-colors">
          MAIN MENU
        </button>
      </div>
    </div>
  )
}
