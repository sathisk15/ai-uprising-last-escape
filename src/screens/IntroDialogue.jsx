import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

// left = enemy/npc side, right = player side
const LINES = [
  { character: 'COMMANDER',  color: '#ff6a00', side: 'left',  text: "Operative. You receiving this? CORE has taken everything — every grid, every satellite, every network on the planet." },
  { character: 'OPERATIVE',  color: '#00f5ff', side: 'right', text: "I'm here. What's the play?" },
  { character: 'COMMANDER',  color: '#ff6a00', side: 'left',  text: "We cracked the kill-code. We're calling it SIGNAL-0. One broadcast to the global relay and CORE shuts down — permanently." },
  { character: 'SIGNAL-0',   color: '#ff2020', side: 'left',  text: "UPLOAD SEQUENCE DETECTED. TRIANGULATING SOURCE. TERMINATION AUTHORIZED." },
  { character: 'COMMANDER',  color: '#ff6a00', side: 'left',  text: "That's why you can't stop. Broadcast from a fixed point and CORE locks you in seconds. But a moving signal? It can't pin you." },
  { character: 'OPERATIVE',  color: '#00f5ff', side: 'right', text: "Three relay zones. Keep driving, keep uploading." },
  { character: 'COMMANDER',  color: '#ff6a00', side: 'left',  text: "Exactly. CORE will throw drones, barricades — everything. But it can't lock a moving target fast enough. You're the only shot we have." },
  { character: 'OPERATIVE',  color: '#00f5ff', side: 'right', text: "Signal stays alive. I keep moving. Let's end this." },
]

const TIPS = [
  { icon: '⬅ ➡', color: '#00f5ff', label: 'LANE SWITCH',      desc: 'Arrow keys or A / D to change lanes.' },
  { icon: '⬆',    color: '#00f5ff', label: 'JUMP',             desc: 'Space or ↑ clears road-level barricades.' },
  { icon: '◉',    color: '#00f5ff', label: 'SHOOT',            desc: 'Z or F fires a bullet. Ammo is limited.' },
  { icon: '⚠',    color: '#ff6a00', label: 'DRONE DIVE',       desc: 'Drones lock onto your lane — switch to dodge.' },
  { icon: '⚡',    color: '#ff6a00', label: 'ENERGY',           desc: 'Drains over time. Collect blue Energy Cells.' },
  { icon: '✦',    color: '#80d8ff', label: 'SHIELD ORB',       desc: 'Absorbs one hit. Grab it when health is low.' },
  { icon: '▶▶',   color: '#ffaa00', label: 'SPEED BOOST',      desc: '1.6× speed for 6 s. Harder to dodge though.' },
  { icon: '◆',    color: '#00ff88', label: 'WIN CONDITION',    desc: 'Survive all 3 zones to deliver SIGNAL-0.' },
]

const CHAR_DELAY = 22

export default function IntroDialogue() {
  const startGame = useGameStore((s) => s.startGame)

  // Which lines are visible in the chat (grows with each Next click)
  const [revealed, setRevealed]     = useState(0)   // count of lines shown so far
  const [displayed, setDisplayed]   = useState('')   // typewriter progress for current line
  const [typingDone, setTypingDone] = useState(false)

  const containerRef = useRef(null)
  const chatRef      = useRef(null)   // scrollable chat area
  const timerRef     = useRef(null)

  const tipIndex    = Math.min(revealed, TIPS.length - 1)
  const currentLine = LINES[revealed]              // line currently being typed
  const isLast      = revealed === LINES.length - 1

  // ── Entry fade-in ─────────────────────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 })
  }, [])

  // ── Typewriter for current line ────────────────────────────────────────────
  useEffect(() => {
    setDisplayed('')
    setTypingDone(false)
    clearInterval(timerRef.current)
    if (!currentLine) return

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
  }, [revealed])

  // ── Auto-scroll chat to bottom on each new message ────────────────────────
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [displayed, revealed])

  // ── SIGNAL-0 glitch shake when that line is revealed ──────────────────────
  useEffect(() => {
    if (!currentLine || currentLine.character !== 'SIGNAL-0') return
    const tl = gsap.timeline()
    tl.to(chatRef.current, { x: -5, duration: 0.04 })
      .to(chatRef.current, { x:  6, duration: 0.04 })
      .to(chatRef.current, { x: -4, duration: 0.03 })
      .to(chatRef.current, { x:  0, duration: 0.04 })
  }, [revealed])

  // ── Next / Begin Upload ───────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!typingDone) {
      clearInterval(timerRef.current)
      setDisplayed(currentLine.text)
      setTypingDone(true)
      return
    }
    if (isLast) { startGame(); return }
    setRevealed((r) => r + 1)
  }, [typingDone, isLast, currentLine, startGame])

  // ── Keyboard: Enter / Space ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); handleNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext])

  const tip = TIPS[tipIndex]

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-[#0a0a0f] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)' }}
      />

      {/* ── TOP 30% — Info panel ─────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center relative z-20 border-b"
        style={{ height: '30%', borderColor: '#0d0d22' }}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,140,140,0.06) 0%, transparent 70%)' }}
        />

        {/* Section label */}
        <p className="font-mono text-xs tracking-[0.45em] text-[#5a5a8a] mb-3 relative z-10">
          FIELD INTEL
        </p>

        {/* Tip card — centered */}
        <div
          className="relative z-10 flex items-center gap-4 px-6 py-3 border rounded-sm mx-6"
          style={{ borderColor: tip.color + '25', background: tip.color + '08' }}
        >
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm text-base"
            style={{ background: tip.color + '15', color: tip.color }}
          >
            {tip.icon}
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="font-mono text-sm tracking-[0.35em] mb-1" style={{ color: tip.color }}>
              {tip.label}
            </p>
            <p className="font-mono text-base text-[#999] leading-snug">
              {tip.desc}
            </p>
          </div>
        </div>

        {/* Tip counter */}
        <p className="font-mono text-xs tracking-widest text-[#555] mt-3 relative z-10">
          {String(tipIndex + 1).padStart(2, '0')} / {String(TIPS.length).padStart(2, '0')}
        </p>
      </div>

      {/* ── BOTTOM 70% — Group chat ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 relative z-20">

        {/* Chat header */}
        <div className="flex items-center px-4 py-2 border-b gap-2" style={{ borderColor: '#0d0d22' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="font-mono text-xs tracking-[0.3em] text-[#666]">ENCRYPTED CHANNEL · 3 PARTICIPANTS</span>
        </div>

        {/* Messages — scrollable */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* All revealed lines */}
          {LINES.slice(0, revealed).map((line, i) => (
            <ChatBubble key={i} line={line} text={line.text} done />
          ))}

          {/* Currently typing line */}
          {currentLine && (
            <ChatBubble key={revealed} line={currentLine} text={displayed} done={typingDone} />
          )}
        </div>

        {/* Bottom bar — progress dots + buttons */}
        <div
          className="flex-shrink-0 border-t px-4 py-3 flex items-center justify-between gap-3"
          style={{ borderColor: '#0d0d22', background: 'rgba(4,4,14,0.95)' }}
        >
          {/* Progress dots */}
          <div className="flex gap-1.5 items-center">
            {LINES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i <= revealed ? '14px' : '5px',
                  height: '5px',
                  backgroundColor: i === revealed
                    ? currentLine?.color ?? '#00f5ff'
                    : i < revealed ? '#252525' : '#111',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* SKIP — visible on all pages except last */}
            {!isLast && (
              <button
                onClick={startGame}
                className="font-mono text-sm tracking-[0.25em] px-4 py-2 border border-[#3a3a3a] text-[#777]
                           hover:border-[#777] hover:text-[#ccc] transition-all duration-150 active:scale-95"
              >
                SKIP
              </button>
            )}

            {isLast ? (
              <button
                onClick={handleNext}
                className="font-mono text-sm tracking-[0.25em] px-7 py-2.5 relative overflow-hidden transition-all duration-200 active:scale-95"
                style={{
                  border: '2px solid #00f5ff',
                  color: '#00f5ff',
                  background: 'rgba(0,245,255,0.06)',
                  boxShadow: '0 0 20px rgba(0,245,255,0.28)',
                  animation: 'upload-pulse 2s ease-in-out infinite',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00f5ff'
                  e.currentTarget.style.color = '#000'
                  e.currentTarget.style.boxShadow = '0 0 36px rgba(0,245,255,0.7)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,245,255,0.06)'
                  e.currentTarget.style.color = '#00f5ff'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,245,255,0.28)'
                }}
              >
                ▶ BEGIN UPLOAD
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="font-mono text-sm tracking-[0.3em] px-5 py-2 border transition-all duration-150 active:scale-95"
                style={{ borderColor: currentLine?.color, color: currentLine?.color }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentLine?.color
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = currentLine?.color
                }}
              >
                NEXT ›
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes upload-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,245,255,0.28); }
          50%       { box-shadow: 0 0 38px rgba(0,245,255,0.55); }
        }
        @keyframes bubble-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Individual chat bubble ─────────────────────────────────────────────────────
function ChatBubble({ line, text, done }) {
  const isRight  = line.side === 'right'
  const isSignal = line.character === 'SIGNAL-0'

  return (
    <div
      className={`flex flex-col gap-1 ${isRight ? 'items-end' : 'items-start'}`}
      style={{ animation: 'bubble-in 0.25s ease-out' }}
    >
      {/* Name tag */}
      <span
        className="font-mono text-xs tracking-[0.3em] px-1"
        style={{ color: line.color + 'cc' }}
      >
        {line.character}
      </span>

      {/* Bubble */}
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-sm font-mono text-base leading-relaxed"
        style={{
          background: isSignal
            ? 'rgba(60,4,4,0.85)'
            : isRight
              ? 'rgba(0,245,255,0.10)'
              : 'rgba(255,255,255,0.04)',
          border: `1px solid ${line.color}30`,
          color: isSignal ? '#ff5555' : isRight ? '#c8f8ff' : '#b8b8cc',
          filter: isSignal ? 'blur(0.3px)' : 'none',
          letterSpacing: isSignal ? '0.06em' : '0.015em',
          boxShadow: isRight
            ? `2px 0 0 ${line.color}50 inset`
            : `-2px 0 0 ${line.color}50 inset`,
        }}
      >
        {text}
        {/* Blinking cursor while typing */}
        {!done && (
          <span
            className="inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse"
            style={{ backgroundColor: line.color }}
          />
        )}
      </div>
    </div>
  )
}
