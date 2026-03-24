import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

export default function MainMenu() {
  const startGame = useGameStore((s) => s.startGame)
  const highScore = useGameStore((s) => s.highScore)

  const containerRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const loreRef = useRef(null)
  const btnRef = useRef(null)
  const scoreRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 }
    )
    .fromTo(titleRef.current,
      { y: -40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      '-=0.2'
    )
    .fromTo(loreRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.1'
    )
    .fromTo(btnRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
    )
    .fromTo(scoreRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      '-=0.2'
    )
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,106,0,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-20 flex flex-col items-center px-6 text-center max-w-lg">
        {/* Year badge */}
        <p ref={subtitleRef} className="text-[#ff6a00] tracking-[0.4em] text-xs mb-3 uppercase" style={{ opacity: 0 }}>
          Earth — 2045
        </p>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-[#00f5ff] font-mono tracking-widest leading-tight mb-1"
          style={{ fontSize: 'clamp(1.6rem, 5vw, 3rem)', opacity: 0 }}
        >
          AI UPRISING
        </h1>
        <h2
          className="text-white font-mono tracking-[0.3em] mb-8"
          style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)' }}
        >
          LAST ESCAPE
        </h2>

        {/* Lore */}
        <p
          ref={loreRef}
          className="text-[#888] text-sm leading-relaxed mb-10 font-mono"
          style={{ opacity: 0 }}
        >
          CORE has seized control of Earth's infrastructure.
          You are the last resistance operative — driving the BLACKOUT Protocol
          through three war zones to shut it all down.
          <br /><br />
          <span className="text-[#ff6a00]">Don't stop. Don't die. Deliver the code.</span>
        </p>

        {/* CTA */}
        <button
          ref={btnRef}
          onClick={startGame}
          className="font-mono tracking-[0.3em] text-sm px-12 py-4 border-2 border-[#00f5ff] text-[#00f5ff] uppercase
                     hover:bg-[#00f5ff] hover:text-black transition-all duration-200 active:scale-95"
          style={{ opacity: 0 }}
        >
          START MISSION
        </button>

        {/* Controls hint */}
        <p className="text-[#444] text-xs mt-6 tracking-widest font-mono">
          ← → LANE &nbsp;|&nbsp; SPACE SHOOT &nbsp;|&nbsp; P PAUSE
        </p>

        {/* High score */}
        <p ref={scoreRef} className="text-[#ff6a00] text-xs mt-4 tracking-widest font-mono" style={{ opacity: 0 }}>
          {highScore > 0 ? `BEST: ${highScore.toLocaleString()}` : 'NO RECORD YET'}
        </p>
      </div>
    </div>
  )
}
