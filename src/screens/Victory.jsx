import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

export default function Victory() {
  const score     = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const kills     = useGameStore((s) => s.kills)
  const distance  = useGameStore((s) => s.distance)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu  = useGameStore((s) => s.goToMenu)

  const containerRef   = useRef(null)
  const flashRef       = useRef(null)
  const ring1Ref       = useRef(null)
  const ring2Ref       = useRef(null)
  const ring3Ref       = useRef(null)
  const uploadRef      = useRef(null)
  const titleRef       = useRef(null)
  const subtitleRef    = useRef(null)
  const tagRef         = useRef(null)
  const statsRef       = useRef(null)
  const btnsRef        = useRef(null)
  const recordRef      = useRef(null)
  const scoreValRef    = useRef(null)
  const distValRef     = useRef(null)
  const killsValRef    = useRef(null)

  const isNewRecord = score >= highScore && score > 0

  useEffect(() => {
    const tl = gsap.timeline()

    // ── 1. Green energy flash ────────────────────────────────────────────────
    tl.set(containerRef.current, { opacity: 1 })
      .fromTo(flashRef.current,
        { opacity: 0.9, scale: 0.5 },
        { opacity: 0, scale: 3, duration: 0.8, ease: 'power2.out' }
      )

    // ── 2. Pulse rings expand outward ────────────────────────────────────────
    tl.fromTo([ring1Ref.current, ring2Ref.current, ring3Ref.current],
      { scale: 0, opacity: 0.7 },
      { scale: 4, opacity: 0, duration: 1.2, ease: 'power1.out', stagger: 0.15 },
      '<0.1'
    )

    // ── 3. "UPLOAD COMPLETE" label sweeps in ─────────────────────────────────
    tl.fromTo(uploadRef.current,
      { scaleX: 0, opacity: 0, transformOrigin: 'center' },
      { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power3.out' },
      '-=0.8'
    )

    // ── 4. SIGNAL-0 slams in ─────────────────────────────────────────────────
    tl.fromTo(titleRef.current,
      { y: 40, opacity: 0, scale: 0.6 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
      '-=0.2'
    )

    // ── 5. Subtitle types in ─────────────────────────────────────────────────
    tl.fromTo(subtitleRef.current,
      { opacity: 0, letterSpacing: '1em' },
      { opacity: 1, letterSpacing: '0.3em', duration: 0.5, ease: 'power2.out' },
      '-=0.1'
    )

    tl.fromTo(tagRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.4 },
      '-=0.1'
    )

    // ── 6. New record badge drops in ─────────────────────────────────────────
    if (isNewRecord && recordRef.current) {
      tl.fromTo(recordRef.current,
        { scale: 2, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' },
        '-=0.1'
      )
    }

    // ── 7. Stats box slides up + counters animate ─────────────────────────────
    tl.fromTo(statsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
      '-=0.2'
    )

    // Count up score
    const scoreObj = { val: 0 }
    tl.to(scoreObj, {
      val: score, duration: 1.2, ease: 'power2.out',
      onUpdate: () => {
        if (scoreValRef.current) scoreValRef.current.textContent = Math.floor(scoreObj.val).toLocaleString()
      }
    }, '-=0.1')

    const distObj = { val: 0 }
    tl.to(distObj, {
      val: Math.floor(distance), duration: 1.0, ease: 'power2.out',
      onUpdate: () => {
        if (distValRef.current) distValRef.current.textContent = Math.floor(distObj.val).toLocaleString() + 'm'
      }
    }, '<')

    const killsObj = { val: 0 }
    tl.to(killsObj, {
      val: kills, duration: 0.8, ease: 'power2.out',
      onUpdate: () => {
        if (killsValRef.current) killsValRef.current.textContent = Math.floor(killsObj.val)
      }
    }, '<')

    // ── 8. Buttons appear ────────────────────────────────────────────────────
    tl.fromTo(btnsRef.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35 },
      '-=0.2'
    )

    // ── Ambient pulse on title ────────────────────────────────────────────────
    gsap.to(titleRef.current, {
      textShadow: '0 0 60px #00ff8888, 0 0 120px #00ff8844',
      repeat: -1, yoyo: true, duration: 1.8, ease: 'sine.inOut', delay: 1.5
    })

    return () => { tl.kill(); gsap.killTweensOf(titleRef.current) }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#020a05] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,0.02) 3px,rgba(0,255,136,0.02) 4px)' }}
      />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,136,0.10) 0%, transparent 60%)' }}
      />

      {/* Flash burst */}
      <div ref={flashRef} className="absolute inset-0 pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(ellipse at center, #00ff88cc 0%, transparent 60%)', opacity: 0 }}
      />

      {/* Pulse rings */}
      {[ring1Ref, ring2Ref, ring3Ref].map((r, i) => (
        <div key={i} ref={r} className="absolute rounded-full pointer-events-none"
          style={{ width: '200px', height: '200px', border: '2px solid #00ff88',
            boxShadow: '0 0 20px #00ff8866', opacity: 0 }}
        />
      ))}

      {/* Upload complete label */}
      <p ref={uploadRef} className="font-mono tracking-[0.6em] text-xs mb-5 relative z-10 uppercase"
        style={{ color: '#00ff88', opacity: 0 }}>
        ✓ UPLOAD COMPLETE
      </p>

      {/* Title block */}
      <div ref={titleRef} className="relative z-10 text-center mb-2" style={{ opacity: 0 }}>
        <h1 className="font-mono font-black tracking-[0.15em] leading-none text-white"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)',
            textShadow: '0 0 40px #00ff8888' }}>
          SIGNAL-0
        </h1>
        <h2 ref={subtitleRef} className="font-mono font-bold text-[#00f5ff]"
          style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2rem)', opacity: 0 }}>
          BROADCAST
        </h2>
      </div>

      {/* Tag lines */}
      <div ref={tagRef} className="relative z-10 text-center mb-6" style={{ opacity: 0 }}>
        <p className="font-mono text-[#00ff88] text-xs tracking-widest">CORE HAS BEEN NEUTRALIZED</p>
        <p className="font-mono text-[#444] text-xs tracking-widest mt-1">HUMANITY IS FREE</p>
      </div>

      {isNewRecord && (
        <div ref={recordRef} className="relative z-10 mb-4" style={{ opacity: 0 }}>
          <p className="font-mono text-[#ff6a00] text-xs tracking-[0.4em] border border-[#ff6a00]/40 px-4 py-1">
            ★ NEW HIGH SCORE ★
          </p>
        </div>
      )}

      {/* Stats */}
      <div ref={statsRef} className="relative z-10 font-mono text-sm mb-8 border border-[#00ff8833] px-10 py-5 min-w-64"
        style={{ opacity: 0, background: 'rgba(0,255,136,0.03)' }}>
        <div className="flex justify-between gap-12 mb-2">
          <span className="text-[#2a6644] tracking-widest">SCORE</span>
          <span ref={scoreValRef} className="text-white">0</span>
        </div>
        <div className="flex justify-between gap-12 mb-2">
          <span className="text-[#2a6644] tracking-widest">BEST</span>
          <span className="text-[#ff6a00]">{highScore.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-12 mb-2">
          <span className="text-[#2a6644] tracking-widest">DISTANCE</span>
          <span ref={distValRef} className="text-white">0m</span>
        </div>
        <div className="flex justify-between gap-12">
          <span className="text-[#2a6644] tracking-widest">KILLS</span>
          <span ref={killsValRef} className="text-[#00ff88]">0</span>
        </div>
      </div>

      {/* Buttons */}
      <div ref={btnsRef} className="relative z-10 flex gap-4" style={{ opacity: 0 }}>
        <button onClick={startGame}
          className="font-mono tracking-widest text-sm px-8 py-3 border border-[#00f5ff] text-[#00f5ff]
                     hover:bg-[#00f5ff] hover:text-black transition-all duration-200 active:scale-95">
          PLAY AGAIN
        </button>
        <button onClick={goToMenu}
          className="font-mono tracking-widest text-sm px-8 py-3 border border-[#333] text-[#666]
                     hover:bg-[#333] hover:text-white transition-all duration-200 active:scale-95">
          MAIN MENU
        </button>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00ff88]/40" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00ff88]/40" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00ff88]/40" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00ff88]/40" />
    </div>
  )
}
