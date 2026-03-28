import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

export default function GameOver() {
  const score     = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const kills     = useGameStore((s) => s.kills)
  const distance  = useGameStore((s) => s.distance)
  const zone      = useGameStore((s) => s.zone)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu  = useGameStore((s) => s.goToMenu)

  const overlayRef  = useRef(null)
  const titleRef    = useRef(null)
  const subRef      = useRef(null)
  const statsRef    = useRef(null)
  const btnsRef     = useRef(null)
  const glitchTimer = useRef(null)

  const isNewRecord = score > 0 && score >= highScore

  useEffect(() => {
    const tl = gsap.timeline()

    // Flash-in
    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.1 }
    )
    // Glitch: rapid flicker
    .to(overlayRef.current, { opacity: 0.4, duration: 0.05, yoyo: true, repeat: 5 })
    // Title slams down
    .fromTo(titleRef.current,
      { y: -60, opacity: 0, skewX: 8 },
      { y: 0, opacity: 1, skewX: 0, duration: 0.5, ease: 'power4.out' }
    )
    .fromTo(subRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' },
      '-=0.15'
    )
    // Stats stagger in
    .fromTo(statsRef.current?.children ?? [],
      { x: -24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' },
      '-=0.1'
    )
    // Buttons
    .fromTo(btnsRef.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3 }
    )

    // Ambient red glitch pulse every 3s
    glitchTimer.current = setInterval(() => {
      if (!titleRef.current) return
      gsap.to(titleRef.current, {
        x: gsap.utils.random(-4, 4),
        skewX: gsap.utils.random(-3, 3),
        duration: 0.05,
        yoyo: true,
        repeat: 3,
        onComplete: () => gsap.set(titleRef.current, { x: 0, skewX: 0 }),
      })
    }, 3000)

    return () => {
      tl.kill()
      clearInterval(glitchTimer.current)
    }
  }, [])

  const zoneLabel = ['', 'Modern Wasteland', 'Industrial Complex', 'Core Stronghold']

  return (
    <div
      ref={overlayRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#080008] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,0,0,0.04) 3px,rgba(255,0,0,0.04) 4px)',
        }}
      />
      {/* Red radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(200,0,0,0.12) 0%, transparent 65%)' }}
      />

      {/* Title */}
      <div className="relative z-10 text-center mb-2" style={{ opacity: 0 }} ref={titleRef}>
        <h1
          className="font-mono font-black tracking-widest text-[#ff2020] leading-none"
          style={{
            fontSize: 'clamp(2.5rem, 10vw, 5rem)',
            textShadow: '0 0 30px #ff000088, 0 0 60px #ff000044',
          }}
        >
          SIGNAL LOST
        </h1>
      </div>

      <p
        ref={subRef}
        className="font-mono text-[#555] tracking-[0.3em] text-xs mb-8"
        style={{ opacity: 0 }}
      >
        UPLOAD ABORTED — CORE TRIANGULATED YOUR POSITION IN ZONE {zone}
      </p>

      {/* Stats */}
      <div
        ref={statsRef}
        className="relative z-10 font-mono text-sm mb-10 border border-[#2a0000] px-10 py-5 space-y-2 min-w-64"
      >
        <div className="flex justify-between gap-12">
          <span className="text-[#553333] tracking-widest">SCORE</span>
          <span className="text-white">{Math.floor(score).toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#553333] tracking-widest">BEST</span>
          <span className={isNewRecord ? 'text-[#ff6a00] animate-pulse' : 'text-[#ff6a00]'}>
            {highScore.toLocaleString()}
            {isNewRecord && ' ★'}
          </span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#553333] tracking-widest">DISTANCE</span>
          <span className="text-white">{Math.floor(distance).toLocaleString()}m</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#553333] tracking-widest">KILLS</span>
          <span className="text-[#ff6a00]">{kills}</span>
        </div>
      </div>

      {/* Buttons */}
      <div ref={btnsRef} className="relative z-10 flex gap-4" style={{ opacity: 0 }}>
        <button
          onClick={startGame}
          className="font-mono tracking-[0.25em] text-sm px-8 py-3 border-2 border-[#ff2020] text-[#ff2020]
                     hover:bg-[#ff2020] hover:text-black transition-all duration-200 active:scale-95"
        >
          RETRY UPLOAD
        </button>
        <button
          onClick={goToMenu}
          className="font-mono tracking-[0.25em] text-sm px-8 py-3 border border-[#333] text-[#666]
                     hover:bg-[#333] hover:text-white transition-all duration-200 active:scale-95"
        >
          MAIN MENU
        </button>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#ff2020]/30" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#ff2020]/30" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#ff2020]/30" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#ff2020]/30" />
    </div>
  )
}
