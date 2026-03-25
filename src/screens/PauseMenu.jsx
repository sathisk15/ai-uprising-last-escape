import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

export default function PauseMenu() {
  const resumeGame = useGameStore((s) => s.resumeGame)
  const goToMenu   = useGameStore((s) => s.goToMenu)
  const score      = useGameStore((s) => s.score)
  const zone       = useGameStore((s) => s.zone)
  const health     = useGameStore((s) => s.health)

  const panelRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.5)' }
    )
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/65 z-50 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="flex flex-col items-center border border-[#00f5ff]/30 bg-black/80 px-12 py-10 font-mono"
        style={{ opacity: 0 }}
      >
        <p className="text-[#00f5ff]/40 tracking-[0.4em] text-[10px] mb-1">— SYSTEM PAUSE —</p>
        <h1 className="text-[#00f5ff] tracking-[0.4em] text-2xl mb-6">PAUSED</h1>

        {/* Quick stats */}
        <div className="flex gap-8 text-xs mb-8 text-white/40">
          <div className="text-center">
            <p className="tracking-widest">ZONE</p>
            <p className="text-white/70 text-base">{zone}</p>
          </div>
          <div className="text-center">
            <p className="tracking-widest">HULL</p>
            <p className="text-white/70 text-base">{health}%</p>
          </div>
          <div className="text-center">
            <p className="tracking-widest">SCORE</p>
            <p className="text-white/70 text-base">{Math.floor(score).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={resumeGame}
            className="tracking-[0.3em] text-sm py-3 border border-[#00f5ff] text-[#00f5ff]
                       hover:bg-[#00f5ff] hover:text-black transition-all duration-150 active:scale-95"
          >
            RESUME
          </button>
          <button
            onClick={goToMenu}
            className="tracking-[0.3em] text-sm py-3 border border-[#333] text-[#555]
                       hover:bg-[#333] hover:text-white transition-all duration-150 active:scale-95"
          >
            MAIN MENU
          </button>
        </div>

        <p className="text-white/20 text-[10px] tracking-widest mt-6">P / ESC TO RESUME</p>
      </div>
    </div>
  )
}
