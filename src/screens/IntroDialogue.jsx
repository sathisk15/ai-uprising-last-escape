import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

const LINES = [
  {
    character: 'COMMANDER',
    color: '#ff6a00',
    text: "Operative. You receiving this? CORE has taken everything — every grid, every satellite, every network on the planet.",
  },
  {
    character: 'OPERATIVE',
    color: '#00f5ff',
    text: "I'm here. What's the play?",
  },
  {
    character: 'COMMANDER',
    color: '#ff6a00',
    text: "We cracked the kill-code. We're calling it SIGNAL-0. One broadcast to the global relay and CORE shuts down — permanently.",
  },
  {
    character: 'SIGNAL-0',
    color: '#ff2020',
    text: "UPLOAD SEQUENCE DETECTED. TRIANGULATING SOURCE. TERMINATION AUTHORIZED.",
  },
  {
    character: 'COMMANDER',
    color: '#ff6a00',
    text: "That's why you can't stop. Broadcast from a fixed point and CORE locks you in seconds. But a moving signal? It can't pin you.",
  },
  {
    character: 'OPERATIVE',
    color: '#00f5ff',
    text: "Three relay zones. Keep driving, keep uploading.",
  },
  {
    character: 'COMMANDER',
    color: '#ff6a00',
    text: "Exactly. CORE will throw drones, barricades — everything. But it can't lock a moving target fast enough. You're the only shot we have.",
  },
  {
    character: 'OPERATIVE',
    color: '#00f5ff',
    text: "Signal stays alive. I keep moving. Let's end this.",
  },
]

// One tip shown per dialogue page
const TIPS = [
  { icon: '⬅ ➡', label: 'LANE SWITCH', color: '#00f5ff', desc: 'Use Arrow Keys or A / D to switch between the three lanes. React fast — obstacles can block any lane.' },
  { icon: '⬆', label: 'JUMP TO DODGE', color: '#00f5ff', desc: 'Press Space or ↑ to jump over road-level barricades. The jump arc is 0.75s — time it early.' },
  { icon: '◉', label: 'SHOOT TO CLEAR', color: '#00f5ff', desc: 'Press Z or F to fire. Bullets destroy drones (+100 score) and barricades (+50 score). Ammo is limited — collect crates.' },
  { icon: '⚠', label: 'DRONE DIVE', color: '#ff6a00', desc: 'Drones sweep lanes then lock onto yours and dive. Switch lanes the moment you see them bank toward you.' },
  { icon: '⚡', label: 'WATCH YOUR ENERGY', color: '#ff6a00', desc: 'Energy drains constantly and faster each zone. Collect blue Energy Cells to stay alive. Hitting zero is instant game over.' },
  { icon: '✦', label: 'SHIELD ORB', color: '#cc44ff', desc: 'The purple orb gives you one free hit. Grab it when your health is low — it absorbs the next collision completely.' },
  { icon: '▶▶', label: 'SPEED BOOST', color: '#ffaa00', desc: 'Orange chevron gives 1.6× speed for 6 seconds. Great for clearing dense zones — but harder to steer. Use wisely.' },
  { icon: '◆', label: 'WIN CONDITION', color: '#00ff88', desc: 'Survive all 3 relay zones to deliver SIGNAL-0. The further you go, the faster and denser the enemies get. Stay alive.' },
]

const CHAR_DELAY = 26

export default function IntroDialogue() {
  const startGame = useGameStore((s) => s.startGame)

  const [lineIndex, setLineIndex]   = useState(0)
  const [displayed, setDisplayed]   = useState('')
  const [typingDone, setTypingDone] = useState(false)

  const containerRef = useRef(null)
  const boxRef       = useRef(null)
  const tipRef       = useRef(null)
  const timerRef     = useRef(null)

  const currentLine = LINES[lineIndex]
  const currentTip  = TIPS[lineIndex % TIPS.length]
  const isLast      = lineIndex === LINES.length - 1
  const isSignal    = currentLine.character === 'SIGNAL-0'

  // ── Entry fade-in ─────────────────────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 })
  }, [])

  // ── Tip card swap animation ────────────────────────────────────────────────
  useEffect(() => {
    if (!tipRef.current) return
    gsap.fromTo(tipRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    )
  }, [lineIndex])

  // ── SIGNAL-0 glitch shake ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isSignal || !boxRef.current) return
    const tl = gsap.timeline()
    tl.to(boxRef.current, { x: -5, duration: 0.04 })
      .to(boxRef.current, { x:  6, duration: 0.04 })
      .to(boxRef.current, { x: -4, duration: 0.03 })
      .to(boxRef.current, { x:  0, duration: 0.04 })
  }, [lineIndex, isSignal])

  // ── Typewriter ────────────────────────────────────────────────────────────
  useEffect(() => {
    setDisplayed('')
    setTypingDone(false)
    clearInterval(timerRef.current)

    let i = 0
    const full = currentLine.text
    timerRef.current = setInterval(() => {
      i++
      setDisplayed(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(timerRef.current)
        setTypingDone(true)
      }
    }, CHAR_DELAY)

    return () => clearInterval(timerRef.current)
  }, [lineIndex])

  // ── Next / Begin Upload ───────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!typingDone) {
      clearInterval(timerRef.current)
      setDisplayed(currentLine.text)
      setTypingDone(true)
      return
    }
    if (isLast) { startGame(); return }
    setLineIndex((i) => i + 1)
  }, [typingDone, isLast, currentLine, startGame])

  // ── Keyboard: Enter / Space ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); handleNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-[#0a0a0f] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }}
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: isSignal
            ? 'radial-gradient(ellipse at 50% 35%, rgba(150,0,0,0.12) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 35%, rgba(0,150,150,0.07) 0%, transparent 60%)',
          transition: 'background 0.5s',
        }}
      />

      {/* ── Top panel — FIELD TIP ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-5 pt-6 pb-3 relative z-20 min-h-0">

        {/* Header row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 rounded-sm bg-[#00f5ff]" />
          <span className="font-mono text-[9px] tracking-[0.4em] text-[#00f5ff] opacity-70">OPERATIVE BRIEFING</span>
        </div>

        {/* Tip card — swaps each page */}
        <div
          ref={tipRef}
          className="flex-1 flex flex-col justify-center border rounded-sm p-5 relative overflow-hidden"
          style={{
            borderColor: isSignal ? '#280808' : '#0e0e20',
            background: isSignal ? 'rgba(18,3,3,0.6)' : 'rgba(6,6,18,0.6)',
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l" style={{ borderColor: currentTip.color + '60' }} />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r" style={{ borderColor: currentTip.color + '60' }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l" style={{ borderColor: currentTip.color + '60' }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r" style={{ borderColor: currentTip.color + '60' }} />

          {/* Icon */}
          <div
            className="text-3xl mb-4 w-14 h-14 flex items-center justify-center rounded-sm"
            style={{ background: currentTip.color + '12', color: currentTip.color }}
          >
            {currentTip.icon}
          </div>

          {/* Label */}
          <p className="font-mono text-[10px] tracking-[0.4em] mb-2" style={{ color: currentTip.color }}>
            {currentTip.label}
          </p>

          {/* Description */}
          <p className="font-mono text-sm leading-relaxed text-[#666]">
            {currentTip.desc}
          </p>

          {/* Tip counter */}
          <p className="font-mono text-[9px] tracking-widest text-[#222] mt-4">
            TIP {String(lineIndex + 1).padStart(2, '0')} / {String(TIPS.length).padStart(2, '0')}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-3">
          {LINES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === lineIndex ? '20px' : '5px',
                height: '5px',
                backgroundColor: i === lineIndex
                  ? currentLine.color
                  : i < lineIndex ? '#252525' : '#151515',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Dialogue box ──────────────────────────────────────────────────── */}
      <div
        ref={boxRef}
        className="relative z-20 mx-4 mb-4 border flex-shrink-0"
        style={{
          background: isSignal ? 'rgba(18,2,2,0.98)' : 'rgba(4,4,16,0.98)',
          borderColor: isSignal ? '#3a0a0a' : '#0d0d2e',
        }}
      >
        {/* SIGNAL-0 scan lines */}
        {isSignal && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[20, 55, 80].map((top) => (
              <div key={top} className="absolute left-0 right-0 h-px"
                style={{
                  top: `${top}%`,
                  background: 'linear-gradient(90deg, transparent, #ff202050, transparent)',
                  animation: 'glitch-scan 1.4s linear infinite',
                  animationDelay: `${top * 0.02}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Character name */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <div className="w-1 h-6 rounded-sm flex-shrink-0" style={{ backgroundColor: currentLine.color }} />
          <span className="font-mono text-sm tracking-[0.35em] font-bold" style={{ color: currentLine.color }}>
            {currentLine.character}
          </span>
          {!typingDone && (
            <span className="text-xs font-mono animate-pulse ml-1" style={{ color: currentLine.color }}>▋</span>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3 h-px" style={{ backgroundColor: isSignal ? '#2a0808' : '#0d0d2e' }} />

        {/* Dialogue text */}
        <p
          className="font-mono leading-relaxed px-5 pb-4 min-h-[5.5rem]"
          style={{
            fontSize: '0.95rem',
            color: isSignal ? '#ff5555' : '#c8c8e8',
            filter: isSignal ? 'blur(0.3px)' : 'none',
            letterSpacing: isSignal ? '0.07em' : '0.02em',
          }}
        >
          {displayed}
          {!typingDone && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{ backgroundColor: currentLine.color }}
            />
          )}
        </p>

        {/* Footer — SKIP + line counter + NEXT/BEGIN */}
        <div className="flex items-center justify-between px-5 pb-4 gap-3">
          {/* Left: line counter */}
          <span className="font-mono text-[10px] tracking-widest text-[#252525] flex-shrink-0">
            {String(lineIndex + 1).padStart(2, '0')} / {String(LINES.length).padStart(2, '0')}
          </span>

          {/* Right: SKIP + NEXT or BEGIN UPLOAD */}
          <div className="flex items-center gap-3">
            {/* SKIP — hidden on last page */}
            {!isLast && (
              <button
                onClick={startGame}
                className="font-mono text-[10px] tracking-[0.25em] text-[#333] hover:text-[#666] transition-colors px-2 py-1"
              >
                SKIP ›
              </button>
            )}

            {/* NEXT / BEGIN UPLOAD */}
            {isLast ? (
              <button
                onClick={handleNext}
                className="font-mono text-sm tracking-[0.3em] px-8 py-3 relative overflow-hidden transition-all duration-200 active:scale-95"
                style={{
                  border: '2px solid #00f5ff',
                  color: '#00f5ff',
                  background: 'rgba(0,245,255,0.06)',
                  boxShadow: '0 0 18px rgba(0,245,255,0.25), inset 0 0 18px rgba(0,245,255,0.04)',
                  animation: 'upload-pulse 2s ease-in-out infinite',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00f5ff'
                  e.currentTarget.style.color = '#000'
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0,245,255,0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,245,255,0.06)'
                  e.currentTarget.style.color = '#00f5ff'
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(0,245,255,0.25), inset 0 0 18px rgba(0,245,255,0.04)'
                }}
              >
                ▶ BEGIN UPLOAD
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="font-mono text-xs tracking-[0.3em] px-5 py-2 border transition-all duration-150 active:scale-95"
                style={{ borderColor: currentLine.color, color: currentLine.color }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentLine.color
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = currentLine.color
                }}
              >
                NEXT ›
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes glitch-scan {
          0%   { transform: translateX(-110%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        @keyframes upload-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(0,245,255,0.25), inset 0 0 18px rgba(0,245,255,0.04); }
          50%       { box-shadow: 0 0 32px rgba(0,245,255,0.50), inset 0 0 24px rgba(0,245,255,0.08); }
        }
      `}</style>
    </div>
  )
}
