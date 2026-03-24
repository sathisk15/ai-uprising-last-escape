import React from 'react'
import useGameStore from '../store/gameStore'

export default function MainMenu() {
  const startGame = useGameStore((s) => s.startGame)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f]">
      <p className="text-[#ff6a00] tracking-widest text-sm mb-2">— STUB —</p>
      <h1 className="text-[#00f5ff] text-4xl tracking-widest mb-6 font-mono">MAIN MENU</h1>
      <button
        onClick={startGame}
        className="border border-[#00f5ff] text-[#00f5ff] px-8 py-3 tracking-widest hover:bg-[#00f5ff] hover:text-black transition-colors"
      >
        START MISSION
      </button>
    </div>
  )
}
