import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

export default function Victory() {
  const score = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const kills = useGameStore((s) => s.kills)
  const distance = useGameStore((s) => s.distance)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu = useGameStore((s) => s.goToMenu)

  const containerRef = useRef(null)
  const headingRef = useRef(null)
  const statsRef = useRef(null)
  const btnsRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 }
    )
    .fromTo(headingRef.current,
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.4)' }
    )
    .fromTo(statsRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4 }
    )
    .fromTo(btnsRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3 }
    )
  }, [])

  const isNewRecord = score >= highScore && score > 0

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Background glow — green for victory */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,136,0.07) 0%, transparent 65%)' }}
      />

      <div ref={headingRef} className="relative z-10 text-center mb-8" style={{ opacity: 0 }}>
        <p className="text-[#00ff88] tracking-[0.4em] text-xs mb-3 uppercase font-mono">Upload Complete</p>
        <h1 className="text-white font-mono tracking-widest leading-tight"
          style={{ fontSize: 'clamp(1.4rem, 4vw, 2.4rem)' }}>
          SIGNAL-0
        </h1>
        <h2 className="text-[#00f5ff] font-mono tracking-[0.3em]"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.8rem)' }}>
          BROADCAST
        </h2>
        <p className="text-[#666] text-sm mt-2 font-mono tracking-widest">CORE HAS BEEN NEUTRALIZED</p>
        <p className="text-[#444] text-xs mt-1 font-mono tracking-widest">HUMANITY IS FREE</p>
        {isNewRecord && (
          <p className="text-[#ff6a00] text-xs mt-3 tracking-[0.3em] font-mono animate-pulse">
            ★ NEW RECORD ★
          </p>
        )}
      </div>

      {/* Stats */}
      <div
        ref={statsRef}
        className="relative z-10 font-mono text-sm text-center space-y-2 mb-10 border border-[#222] px-10 py-5"
        style={{ opacity: 0 }}
      >
        <div className="flex justify-between gap-12">
          <span className="text-[#555] tracking-widest">SCORE</span>
          <span className="text-white">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#555] tracking-widest">BEST</span>
          <span className="text-[#ff6a00]">{highScore.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#555] tracking-widest">DISTANCE</span>
          <span className="text-white">{Math.floor(distance).toLocaleString()}m</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#555] tracking-widest">KILLS</span>
          <span className="text-[#00ff88]">{kills}</span>
        </div>
      </div>

      {/* Buttons */}
      <div ref={btnsRef} className="relative z-10 flex gap-4" style={{ opacity: 0 }}>
        <button
          onClick={startGame}
          className="font-mono tracking-widest text-sm px-8 py-3 border border-[#00f5ff] text-[#00f5ff]
                     hover:bg-[#00f5ff] hover:text-black transition-all duration-200 active:scale-95"
        >
          PLAY AGAIN
        </button>
        <button
          onClick={goToMenu}
          className="font-mono tracking-widest text-sm px-8 py-3 border border-[#333] text-[#777]
                     hover:bg-[#333] hover:text-white transition-all duration-200 active:scale-95"
        >
          MAIN MENU
        </button>
      </div>
    </div>
  )
}
