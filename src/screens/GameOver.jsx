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

  const overlayRef   = useRef(null)
  const flashRef     = useRef(null)
  const noiseRef     = useRef(null)
  const titleRef     = useRef(null)
  const ghostRedRef  = useRef(null)
  const ghostCynRef  = useRef(null)
  const subRef       = useRef(null)
  const statsRef     = useRef(null)
  const btnsRef      = useRef(null)
  const glitchTimer  = useRef(null)
  const scoreValRef  = useRef(null)
  const distValRef   = useRef(null)
  const killsValRef  = useRef(null)

  const isNewRecord = score > 0 && score >= highScore

  useEffect(() => {
    const tl = gsap.timeline()

    // ── 1. Full-screen red flash strobe ─────────────────────────────────────
    tl.set(overlayRef.current, { opacity: 1 })
      .fromTo(flashRef.current,
        { opacity: 1 },
        { opacity: 0, duration: 0.12, ease: 'power2.out' }
      )
      .to(flashRef.current, { opacity: 0.6, duration: 0.05 })
      .to(flashRef.current, { opacity: 0,   duration: 0.08 })
      .to(flashRef.current, { opacity: 0.3, duration: 0.04 })
      .to(flashRef.current, { opacity: 0,   duration: 0.12 })

    // ── 2. Noise / static flicker ─────────────────────────────────────────────
    tl.fromTo(noiseRef.current,
      { opacity: 0.35 },
      { opacity: 0, duration: 0.6, ease: 'power2.in' },
      '-=0.3'
    )

    // ── 3. Ghost title layers slam in offset (chromatic aberration) ──────────
    tl.fromTo([ghostRedRef.current, ghostCynRef.current],
      { y: -80, opacity: 0, skewX: 15 },
      { y: 0, opacity: 0.55, skewX: 0, duration: 0.35, ease: 'power4.out', stagger: 0.04 },
      '-=0.2'
    )
    // Main title slams over them
    .fromTo(titleRef.current,
      { y: -80, opacity: 0, skewX: 8 },
      { y: 0, opacity: 1, skewX: 0, duration: 0.35, ease: 'power4.out' },
      '<0.04'
    )
    // Ghost layers jitter then settle
    .to(ghostRedRef.current,  { x: 0, y: 0, opacity: 0, duration: 0.25 }, '-=0.1')
    .to(ghostCynRef.current,  { x: 0, y: 0, opacity: 0, duration: 0.25 }, '<')

    // ── 4. Subtitle slides in ────────────────────────────────────────────────
    tl.fromTo(subRef.current,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' },
      '-=0.1'
    )

    // ── 5. Stats slide in + counters animate ─────────────────────────────────
    tl.fromTo(statsRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
      '-=0.1'
    )

    const scoreObj = { val: 0 }
    tl.to(scoreObj, {
      val: score, duration: 1.0, ease: 'power2.out',
      onUpdate: () => {
        if (scoreValRef.current) scoreValRef.current.textContent = Math.floor(scoreObj.val).toLocaleString()
      }
    }, '-=0.1')

    const distObj = { val: 0 }
    tl.to(distObj, {
      val: Math.floor(distance), duration: 0.9, ease: 'power2.out',
      onUpdate: () => {
        if (distValRef.current) distValRef.current.textContent = Math.floor(distObj.val).toLocaleString() + 'm'
      }
    }, '<')

    const killsObj = { val: 0 }
    tl.to(killsObj, {
      val: kills, duration: 0.7, ease: 'power2.out',
      onUpdate: () => {
        if (killsValRef.current) killsValRef.current.textContent = Math.floor(killsObj.val)
      }
    }, '<')

    // ── 6. Buttons ──────────────────────────────────────────────────────────
    tl.fromTo(btnsRef.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3 },
      '-=0.2'
    )

    // ── Ambient glitch pulse every 3s ────────────────────────────────────────
    glitchTimer.current = setInterval(() => {
      if (!titleRef.current) return
      const seq = gsap.timeline()
      seq.to([ghostRedRef.current, ghostCynRef.current], { opacity: 0.4, duration: 0.02 })
        .to(ghostRedRef.current,  { x: gsap.utils.random(-8, 8), y: gsap.utils.random(-3, 3), duration: 0.04 })
        .to(ghostCynRef.current,  { x: gsap.utils.random(-8, 8), y: gsap.utils.random(-3, 3), duration: 0.04 }, '<')
        .to(titleRef.current,     { skewX: gsap.utils.random(-4, 4), duration: 0.04 }, '<')
        .to([ghostRedRef.current, ghostCynRef.current], { opacity: 0, duration: 0.08 })
        .to(titleRef.current,     { skewX: 0, duration: 0.06 }, '<')
        .to([ghostRedRef.current, ghostCynRef.current], { x: 0, y: 0, duration: 0 })
    }, 2800)

    return () => {
      tl.kill()
      clearInterval(glitchTimer.current)
      gsap.killTweensOf([titleRef.current, ghostRedRef.current, ghostCynRef.current])
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#050005] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,0,0,0.035) 3px,rgba(255,0,0,0.035) 4px)' }}
      />

      {/* Red radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(200,0,0,0.15) 0%, transparent 60%)' }}
      />

      {/* Flash overlay */}
      <div ref={flashRef} className="absolute inset-0 pointer-events-none"
        style={{ background: '#ff0000', opacity: 0 }}
      />

      {/* Static noise overlay */}
      <div ref={noiseRef} className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
          mixBlendMode: 'overlay',
          opacity: 0,
        }}
      />

      {/* Title with chromatic ghost layers */}
      <div className="relative z-10 text-center mb-3">
        <div className="relative inline-block">
          {/* Red ghost */}
          <h1 ref={ghostRedRef} className="absolute inset-0 font-mono font-black tracking-widest leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', color: '#ff2020',
              transform: 'translate(-6px, 3px)', filter: 'blur(1.5px)', opacity: 0 }}>
            SIGNAL LOST
          </h1>
          {/* Cyan ghost */}
          <h1 ref={ghostCynRef} className="absolute inset-0 font-mono font-black tracking-widest leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', color: '#00f5ff',
              transform: 'translate(6px, -3px)', filter: 'blur(1.5px)', opacity: 0 }}>
            SIGNAL LOST
          </h1>
          {/* Main */}
          <h1 ref={titleRef} className="relative font-mono font-black tracking-widest leading-none"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', color: '#ff2020',
              textShadow: '0 0 30px #ff000088, 0 0 60px #ff000044', opacity: 0 }}>
            SIGNAL LOST
          </h1>
        </div>
      </div>

      <p ref={subRef} className="font-mono text-[#553333] tracking-[0.25em] text-xs mb-8 relative z-10 text-center px-4"
        style={{ opacity: 0 }}>
        UPLOAD ABORTED — CORE TRIANGULATED YOUR POSITION IN ZONE {zone}
      </p>

      {/* Stats */}
      <div ref={statsRef} className="relative z-10 font-mono text-sm mb-8 border border-[#2a0000] px-10 py-5 min-w-64"
        style={{ opacity: 0, background: 'rgba(80,0,0,0.15)' }}>
        <div className="flex justify-between gap-12 mb-2">
          <span className="text-[#553333] tracking-widest">SCORE</span>
          <span ref={scoreValRef} className="text-white">0</span>
        </div>
        <div className="flex justify-between gap-12 mb-2">
          <span className="text-[#553333] tracking-widest">BEST</span>
          <span className={isNewRecord ? 'text-[#ff6a00] animate-pulse' : 'text-[#ff6a00]'}>
            {highScore.toLocaleString()}{isNewRecord && ' ★'}
          </span>
        </div>
        <div className="flex justify-between gap-12 mb-2">
          <span className="text-[#553333] tracking-widest">DISTANCE</span>
          <span ref={distValRef} className="text-white">0m</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#553333] tracking-widest">KILLS</span>
          <span ref={killsValRef} className="text-[#ff6a00]">0</span>
        </div>
      </div>

      {/* Buttons */}
      <div ref={btnsRef} className="relative z-10 flex gap-4" style={{ opacity: 0 }}>
        <button onClick={startGame}
          className="font-mono tracking-[0.25em] text-sm px-8 py-3 border-2 border-[#ff2020] text-[#ff2020]
                     hover:bg-[#ff2020] hover:text-black transition-all duration-200 active:scale-95">
          RETRY UPLOAD
        </button>
        <button onClick={goToMenu}
          className="font-mono tracking-[0.25em] text-sm px-8 py-3 border border-[#333] text-[#666]
                     hover:bg-[#333] hover:text-white transition-all duration-200 active:scale-95">
          MAIN MENU
        </button>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#ff2020]/40" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#ff2020]/40" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#ff2020]/40" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#ff2020]/40" />
    </div>
  )
}
