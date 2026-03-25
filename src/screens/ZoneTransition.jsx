import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'
import { ZONES } from '../game/zones'

const HOLD_MS = 2800   // how long the screen stays before auto-resuming

export default function ZoneTransition() {
  const zone                = useGameStore((s) => s.zone)
  const resumeFromTransition = useGameStore((s) => s.resumeFromTransition)
  const zoneData            = ZONES[zone]

  // Refs for animated elements
  const overlayRef   = useRef(null)
  const topSlashRef  = useRef(null)
  const botSlashRef  = useRef(null)
  const labelRef     = useRef(null)
  const numberRef    = useRef(null)
  const nameRef      = useRef(null)
  const taglineRef   = useRef(null)
  const progressRef  = useRef(null)

  useEffect(() => {
    const color  = zoneData.ambientColor
    const tl     = gsap.timeline()

    // ── Intro ──────────────────────────────────────────────────────────────
    // Black overlay flashes in
    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.15 }
    )
    // Two horizontal slash bars sweep in from opposite sides
    .fromTo(topSlashRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.35, ease: 'power3.out' }
    )
    .fromTo(botSlashRef.current,
      { scaleX: 0, transformOrigin: 'right center' },
      { scaleX: 1, duration: 0.35, ease: 'power3.out' },
      '<'
    )
    // Zone label ("ENTERING ZONE")
    .fromTo(labelRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
      '-=0.1'
    )
    // Big zone number
    .fromTo(numberRef.current,
      { scale: 2.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' },
      '-=0.1'
    )
    // Zone name
    .fromTo(nameRef.current,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
      '-=0.25'
    )
    // Tagline
    .fromTo(taglineRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      '-=0.1'
    )
    // Progress bar sweep
    .fromTo(progressRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.6, ease: 'power2.inOut' },
      '-=0.2'
    )

    // ── Hold ───────────────────────────────────────────────────────────────
    tl.to({}, { duration: HOLD_MS / 1000 - 1.4 })

    // ── Outro ──────────────────────────────────────────────────────────────
    .to([nameRef.current, numberRef.current, labelRef.current, taglineRef.current], {
      opacity: 0, y: -15, duration: 0.3, stagger: 0.04, ease: 'power2.in',
    })
    .to([topSlashRef.current, botSlashRef.current], {
      scaleX: 0, duration: 0.3, ease: 'power3.in',
    }, '-=0.15')
    .to(overlayRef.current, {
      opacity: 0, duration: 0.25,
      onComplete: resumeFromTransition,
    })

    return () => tl.kill()
  }, [zone]) // re-run if zone changes (shouldn't, but safe)

  const taglines = {
    2: 'CORE defences intensify. Watch the skies.',
    3: 'Final approach. Deliver the BLACKOUT Protocol.',
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: 0, background: '#000' }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Zone color radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${zoneData.ambientColor}22 0%, transparent 65%)`,
        }}
      />

      {/* Top slash bar */}
      <div
        ref={topSlashRef}
        className="absolute w-full"
        style={{
          height: '3px',
          top: '30%',
          background: zoneData.ambientColor,
          boxShadow: `0 0 12px ${zoneData.ambientColor}`,
        }}
      />

      {/* Bottom slash bar */}
      <div
        ref={botSlashRef}
        className="absolute w-full"
        style={{
          height: '3px',
          bottom: '30%',
          background: zoneData.ambientColor,
          boxShadow: `0 0 12px ${zoneData.ambientColor}`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <p
          ref={labelRef}
          className="font-mono tracking-[0.5em] text-xs mb-3"
          style={{ color: zoneData.ambientColor, opacity: 0 }}
        >
          — ENTERING ZONE —
        </p>

        <div
          ref={numberRef}
          className="font-mono font-bold leading-none mb-2"
          style={{
            fontSize: 'clamp(5rem, 18vw, 9rem)',
            color: zoneData.ambientColor,
            textShadow: `0 0 40px ${zoneData.ambientColor}88`,
            opacity: 0,
          }}
        >
          {zone}
        </div>

        <h2
          ref={nameRef}
          className="font-mono tracking-[0.3em] text-white mb-4"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.6rem)', opacity: 0 }}
        >
          {zoneData.name.toUpperCase()}
        </h2>

        <p
          ref={taglineRef}
          className="font-mono text-xs tracking-widest max-w-xs"
          style={{ color: '#888', opacity: 0 }}
        >
          {taglines[zone] ?? ''}
        </p>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-8 w-48">
        <div className="w-full h-px bg-white/10 overflow-hidden">
          <div
            ref={progressRef}
            className="h-full"
            style={{
              background: zoneData.ambientColor,
              boxShadow: `0 0 6px ${zoneData.ambientColor}`,
            }}
          />
        </div>
        <p className="text-center text-[9px] tracking-widest text-white/30 font-mono mt-2">
          PREPARING ROUTE
        </p>
      </div>
    </div>
  )
}
