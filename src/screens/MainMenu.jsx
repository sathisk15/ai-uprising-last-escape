import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

// Animated particle dots floating in background
function Particles() {
  const count = 28
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const size   = 1 + Math.random() * 2
        const left   = Math.random() * 100
        const delay  = Math.random() * 6
        const dur    = 6 + Math.random() * 8
        const color  = i % 5 === 0 ? '#ff6a00' : '#00f5ff'
        const top    = 10 + Math.random() * 80
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: `${left}%`, top: `${top}%`,
              backgroundColor: color,
              opacity: 0.15 + Math.random() * 0.25,
              animation: `float-dot ${dur}s ${delay}s ease-in-out infinite alternate`,
            }}
          />
        )
      })}
    </div>
  )
}

// Animated grid lines — perspective road feel
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.07 }}>
      {/* Vertical lines */}
      {[10, 22, 34, 46, 54, 66, 78, 90].map((left) => (
        <div
          key={left}
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${left}%`, background: 'linear-gradient(180deg, transparent, #00f5ff 40%, transparent)' }}
        />
      ))}
      {/* Horizontal lines */}
      {[15, 30, 45, 60, 75, 88].map((top) => (
        <div
          key={top}
          className="absolute left-0 right-0 h-px"
          style={{ top: `${top}%`, background: 'linear-gradient(90deg, transparent, #00f5ff 40%, transparent)' }}
        />
      ))}
    </div>
  )
}

export default function MainMenu() {
  const startIntro = useGameStore((s) => s.startIntro)
  const highScore  = useGameStore((s) => s.highScore)
  const [btnHover, setBtnHover] = useState(false)

  const containerRef  = useRef(null)
  const badgeRef      = useRef(null)
  const titleLineRef  = useRef(null)  // decorative line above title
  const title1Ref     = useRef(null)
  const title2Ref     = useRef(null)
  const taglineRef    = useRef(null)
  const dividerRef    = useRef(null)
  const loreRef       = useRef(null)
  const zonesRef      = useRef(null)
  const btnRef        = useRef(null)
  const scoreRef      = useRef(null)
  const controlsRef   = useRef(null)
  const glowRef       = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // Background glow pulses on loop
    gsap.to(glowRef.current, {
      opacity: 0.18,
      scale: 1.15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })

      // Badge
      .fromTo(badgeRef.current,
        { opacity: 0, y: -12, letterSpacing: '0.2em' },
        { opacity: 1, y: 0,  letterSpacing: '0.45em', duration: 0.6 }
      )

      // Top line
      .fromTo(titleLineRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'left center' },
        { scaleX: 1, opacity: 1, duration: 0.5 },
        '-=0.3'
      )

      // Title 1 — letter split feel via skew + scale
      .fromTo(title1Ref.current,
        { opacity: 0, y: 40, skewX: -6 },
        { opacity: 1, y: 0,  skewX: 0, duration: 0.55, ease: 'power4.out' },
        '-=0.2'
      )
      .fromTo(title2Ref.current,
        { opacity: 0, y: 30, skewX: -4 },
        { opacity: 1, y: 0,  skewX: 0, duration: 0.45, ease: 'power3.out' },
        '-=0.3'
      )

      // Tagline
      .fromTo(taglineRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4 },
        '-=0.1'
      )

      // Divider
      .fromTo(dividerRef.current,
        { scaleX: 0, transformOrigin: 'center' },
        { scaleX: 1, duration: 0.5 },
        '-=0.1'
      )

      // Lore
      .fromTo(loreRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.2'
      )

      // Zone strip
      .fromTo(zonesRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4 },
        '-=0.1'
      )

      // Button
      .fromTo(btnRef.current,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)' },
        '-=0.1'
      )

      // Bottom row
      .fromTo([scoreRef.current, controlsRef.current],
        { opacity: 0 },
        { opacity: 1, duration: 0.4, stagger: 0.1 },
        '-=0.2'
      )

    // Button idle pulse after entrance
    gsap.to(btnRef.current, {
      boxShadow: '0 0 28px rgba(0,245,255,0.45)',
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2.5,
    })

    return () => gsap.killTweensOf([glowRef.current, btnRef.current])
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#07070f] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* ── Background layers ───────────────────────────────────────────── */}
      <GridBackground />
      <Particles />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.09) 2px, rgba(0,0,0,0.09) 4px)' }}
      />

      {/* Central glow orb */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: '60vw', height: '60vw',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(0,180,200,0.12) 0%, rgba(255,106,0,0.04) 50%, transparent 70%)',
          opacity: 0.12,
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2 border-[#00f5ff22] z-20" />
      <div className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 border-[#00f5ff22] z-20" />
      <div className="absolute bottom-5 left-5 w-8 h-8 border-b-2 border-l-2 border-[#00f5ff22] z-20" />
      <div className="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2 border-[#00f5ff22] z-20" />

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-col items-center px-6 text-center w-full max-w-xl">

        {/* Year badge */}
        <div ref={badgeRef} className="flex items-center gap-3 mb-4" style={{ opacity: 0 }}>
          <div className="h-px w-8 bg-[#ff6a00]" />
          <span className="text-[#ff6a00] tracking-[0.45em] text-[10px] font-mono uppercase">Earth · 2045</span>
          <div className="h-px w-8 bg-[#ff6a00]" />
        </div>

        {/* Title accent line */}
        <div ref={titleLineRef} className="h-px w-48 mb-3" style={{ background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)', opacity: 0 }} />

        {/* Title */}
        <h1
          ref={title1Ref}
          className="font-mono font-black tracking-[0.22em] leading-none text-[#00f5ff] relative"
          style={{
            fontSize: 'clamp(2.4rem, 8vw, 4.2rem)',
            opacity: 0,
            textShadow: '0 0 40px rgba(0,245,255,0.5), 0 0 80px rgba(0,245,255,0.2)',
          }}
        >
          AI UPRISING
        </h1>
        <h2
          ref={title2Ref}
          className="font-mono font-bold tracking-[0.45em] text-white mt-1 mb-3"
          style={{
            fontSize: 'clamp(0.85rem, 2.8vw, 1.35rem)',
            opacity: 0,
            textShadow: '0 0 20px rgba(255,255,255,0.2)',
          }}
        >
          LAST ESCAPE
        </h2>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="font-mono text-[#ff6a00] tracking-[0.25em] text-[11px] mb-5"
          style={{ opacity: 0 }}
        >
          STAY CONNECTED · KEEP MOVING · END CORE
        </p>

        {/* Divider */}
        <div ref={dividerRef} className="h-px w-full mb-5" style={{ background: 'linear-gradient(90deg, transparent, #ffffff0d, transparent)', opacity: 0 }} />

        {/* Lore — condensed */}
        <p
          ref={loreRef}
          className="text-[#666] text-sm leading-relaxed mb-5 font-mono"
          style={{ opacity: 0 }}
        >
          CORE went rogue. Every network, every grid — under its control.
          We found the counter-code: <span className="text-[#00f5ff]">SIGNAL-0</span>.
          One broadcast shuts it down forever. But from a fixed point?
          CORE triangulates in seconds.
          <br /><br />
          The only way: <span className="text-white font-bold">upload it on the move.</span>
        </p>

        {/* Zone strip */}
        <div ref={zonesRef} className="flex gap-2 mb-7 w-full" style={{ opacity: 0 }}>
          {[
            { num: '01', name: 'WASTELAND',   color: '#ff6a00' },
            { num: '02', name: 'INDUSTRIAL',  color: '#00ff88' },
            { num: '03', name: 'CORE',         color: '#ff2020' },
          ].map((z) => (
            <div
              key={z.num}
              className="flex-1 flex flex-col items-center py-2 border rounded-sm"
              style={{ borderColor: z.color + '30', background: z.color + '08' }}
            >
              <span className="font-mono text-[9px] tracking-[0.3em] mb-0.5" style={{ color: z.color + '80' }}>ZONE</span>
              <span className="font-mono text-base font-bold" style={{ color: z.color }}>{z.num}</span>
              <span className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: z.color + '60' }}>{z.name}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          ref={btnRef}
          onClick={startIntro}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          className="font-mono font-bold tracking-[0.35em] text-sm px-14 py-4 mb-5 relative overflow-hidden transition-all duration-200 active:scale-95"
          style={{
            opacity: 0,
            border: '2px solid #00f5ff',
            color: btnHover ? '#000' : '#00f5ff',
            background: btnHover ? '#00f5ff' : 'rgba(0,245,255,0.06)',
            boxShadow: btnHover
              ? '0 0 40px rgba(0,245,255,0.7)'
              : '0 0 18px rgba(0,245,255,0.25)',
          }}
        >
          {/* Animated corner accents on hover */}
          {btnHover && <>
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black" />
          </>}
          ▶ BEGIN UPLOAD
        </button>

        {/* Controls hint */}
        <div ref={controlsRef} className="flex gap-4 text-[#333] font-mono text-[10px] tracking-widest mb-3 flex-wrap justify-center" style={{ opacity: 0 }}>
          {['← → LANE', '↑ JUMP', 'Z SHOOT', 'P PAUSE'].map((hint) => (
            <span key={hint} className="border border-[#1a1a1a] px-2 py-0.5 rounded-sm">{hint}</span>
          ))}
        </div>

        {/* High score */}
        <p ref={scoreRef} className="font-mono text-xs tracking-widest" style={{ opacity: 0, color: highScore > 0 ? '#ff6a00' : '#222' }}>
          {highScore > 0 ? `▲ BEST SIGNAL: ${highScore.toLocaleString()} pts` : '— NO SIGNAL RECORD —'}
        </p>
      </div>

      <style>{`
        @keyframes float-dot {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-18px) scale(1.3); }
        }
      `}</style>
    </div>
  )
}
