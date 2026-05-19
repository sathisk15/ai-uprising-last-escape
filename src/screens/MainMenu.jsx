import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'
import LeaderboardService from '../services/LeaderboardService'

/* ─────────────────────── background particles ─────────────────────── */
function Particles() {
  const dots = useRef(
    Array.from({ length: 28 }).map((_, i) => ({
      size:  1 + Math.random() * 2.5,
      left:  Math.random() * 100,
      top:   5 + Math.random() * 90,
      delay: Math.random() * 7,
      dur:   5 + Math.random() * 9,
      color: i % 6 === 0 ? '#ff6a00' : '#00f5ff',
      op:    0.08 + Math.random() * 0.18,
    }))
  ).current
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: d.size, height: d.size,
          left: `${d.left}%`, top: `${d.top}%`,
          backgroundColor: d.color, opacity: d.op,
          animation: `fdot ${d.dur}s ${d.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  )
}

/* ─────────────────────── top-5 leaderboard panel ──────────────────── */
const RANK_COLOR  = ['#ffd700', '#c0c0c0', '#cd7f32', '#00f5ff99', '#00f5ff55']
const RANK_LABEL  = ['1ST', '2ND', '3RD', '4TH', '5TH']

function LeaderboardPanel() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    LeaderboardService.getTopScores(5).then((data) => {
      setRows(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-xs font-bold tracking-[0.4em] text-[#555]">GLOBAL TOP 5</span>
        <div className="flex-1 h-px" style={{ background: '#ffffff0a' }} />
      </div>
      <div className="flex-1 flex flex-col border" style={{ borderColor: '#00f5ff14', background: 'rgba(0,245,255,0.018)' }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-[10px] text-[#333] tracking-widest animate-pulse">LOADING…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-[10px] text-[#2a2a2a] tracking-widest">— EMPTY —</span>
          </div>
        ) : (
          rows.map((r, i) => (
            <div key={r.id}
              className="flex items-center gap-2 px-2.5 py-1.5 border-b last:border-0"
              style={{ borderColor: '#ffffff07', background: i === 0 ? 'rgba(255,215,0,0.03)' : 'transparent' }}
            >
              <span className="font-mono text-xs w-7 text-center font-black shrink-0"
                style={{ color: RANK_COLOR[i] }}>{RANK_LABEL[i]}</span>
              <span className="font-mono text-xs font-semibold tracking-widest flex-1 truncate"
                style={{ color: i === 0 ? '#fff' : '#999' }}>
                {r.name || '???'}
              </span>
              <span className="font-mono text-xs font-black shrink-0"
                style={{ color: RANK_COLOR[i] }}>
                {(r.bestScore || 0).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ─────────────────────── inline confirm card ───────────────────────── */
function ConfirmCard({ player, onConfirm, onCancel }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 14, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.7)' }
    )
  }, [])

  return (
    <div ref={ref} className="w-full mb-3 border" style={{ borderColor: '#ff6a0033', background: 'rgba(255,106,0,0.04)', opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: '#ff6a0022' }}>
        <span className="text-[#ff6a00] text-xs">⚡</span>
        <span className="font-mono text-[10px] tracking-[0.4em] text-[#ff6a00]">RETURNING AGENT DETECTED</span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-mono text-base font-black tracking-[0.25em] text-white">{player.name}</p>
          <p className="font-mono text-[10px] tracking-widest text-[#555] mt-0.5">
            {player.gamesPlayed ?? 0} MISSIONS LOGGED
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-black" style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
            {(player.bestScore ?? 0).toLocaleString()}
          </p>
          <p className="font-mono text-[10px] tracking-widest text-[#555]">BEST SCORE</p>
        </div>
      </div>

      {/* Prompt */}
      <div className="px-4 pb-3">
        <p className="font-mono text-[11px] tracking-[0.3em] text-[#666] mb-3">CONTINUE AS THIS AGENT?</p>
        <div className="flex gap-2">
          <button onClick={onConfirm}
            className="flex-1 font-mono text-xs font-bold tracking-[0.3em] py-2.5 transition-all duration-150 active:scale-95"
            style={{ background: '#00f5ff', color: '#000' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#00f5ff' }}
          >
            YES, CONTINUE ▶
          </button>
          <button onClick={onCancel}
            className="flex-1 font-mono text-xs tracking-[0.3em] py-2.5 border transition-all duration-150 active:scale-95"
            style={{ borderColor: '#ffffff22', color: '#666' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ffffff55' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#ffffff22' }}
          >
            NEW CALLSIGN
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── main component ───────────────────────────── */
export default function MainMenu() {
  const startIntro    = useGameStore((s) => s.startIntro)
  const highScore     = useGameStore((s) => s.highScore)
  const playerName    = useGameStore((s) => s.playerName)
  const setPlayerName = useGameStore((s) => s.setPlayerName)

  const [nameInput,   setNameInput]   = useState(playerName || '')
  const [nameMsg,     setNameMsg]     = useState('')
  const [phase,       setPhase]       = useState('idle') // 'idle' | 'checking' | 'confirm'
  const [foundPlayer, setFoundPlayer] = useState(null)
  const [btnHover,    setBtnHover]    = useState(false)

  const isValidName = (nameInput || '').trim().length >= 3

  const containerRef = useRef(null)
  const glowRef      = useRef(null)
  const titleRef     = useRef(null)
  const subRef       = useRef(null)
  const taglineRef   = useRef(null)
  const dividerRef   = useRef(null)
  const loreRef      = useRef(null)
  const zonesRef     = useRef(null)
  const middleRef    = useRef(null)
  const actionRef    = useRef(null)
  const btnRef       = useRef(null)
  const bottomRef    = useRef(null)

  /* entrance animation */
  useEffect(() => {
    gsap.to(glowRef.current, {
      opacity: 0.2, scale: 1.15, duration: 3.5,
      repeat: -1, yoyo: true, ease: 'sine.inOut',
    })
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(titleRef.current,   { opacity:0, y:32, skewX:-6 }, { opacity:1, y:0, skewX:0, duration:0.6, ease:'power4.out' }, '-=0.05')
      .fromTo(subRef.current,     { opacity:0, y:20, skewX:-3 }, { opacity:1, y:0, skewX:0, duration:0.45 }, '-=0.35')
      .fromTo(taglineRef.current, { opacity:0, x:-18 },           { opacity:1, x:0, duration:0.4 }, '-=0.15')
      .fromTo(dividerRef.current, { scaleX:0, transformOrigin:'center' }, { scaleX:1, duration:0.55 }, '-=0.1')
      .fromTo(loreRef.current,    { opacity:0, y:12 }, { opacity:1, y:0, duration:0.45 }, '-=0.2')
      .fromTo(zonesRef.current,   { opacity:0, y:8  }, { opacity:1, y:0, duration:0.4  }, '-=0.1')
      .fromTo(middleRef.current,  { opacity:0, y:10 }, { opacity:1, y:0, duration:0.4  }, '-=0.1')
      .fromTo(actionRef.current,  { opacity:0 },       { opacity:1, duration:0.35 },       '-=0.1')
      .fromTo(bottomRef.current,  { opacity:0 },       { opacity:1, duration:0.35 },       '-=0.05')
    return () => { gsap.killTweensOf(glowRef.current) }
  }, [])

  /* button pulse — fires whenever button mounts (isValidName flips true in idle phase) */
  useEffect(() => {
    if (!isValidName || phase !== 'idle' || !btnRef.current) return
    gsap.killTweensOf(btnRef.current)
    gsap.fromTo(btnRef.current,
      { opacity:0, y:10, scale:0.92 },
      { opacity:1, y:0,  scale:1,   duration:0.4, ease:'back.out(1.7)' }
    )
    gsap.to(btnRef.current, {
      boxShadow: '0 0 32px rgba(0,245,255,0.55)',
      duration: 1.5, repeat:-1, yoyo:true, ease:'sine.inOut', delay:0.55,
    })
    return () => { gsap.killTweensOf(btnRef.current) }
  }, [isValidName, phase])

  const beginWithName = async () => {
    const name = (nameInput || '').trim().slice(0, 14).toUpperCase()
    if (!name) { setNameMsg('ENTER A USERNAME'); return }

    // Same name already confirmed this session — no need to re-check Firestore
    if (name === playerName) {
      startIntro()
      return
    }

    setPhase('checking')
    setNameMsg('')
    const result = await LeaderboardService.ensurePlayer(name)
    if (!result.ok) {
      const msgs = {
        'permission-denied': 'FIRESTORE RULES BLOCKED',
        'unavailable':       'NETWORK OFFLINE',
        'not-configured':    'FIREBASE NOT CONFIGURED',
      }
      setNameMsg(msgs[result.reason] || 'ERROR — TRY AGAIN')
      setPhase('idle')
      return
    }
    // Only prompt if the name already belongs to someone else (different from stored name)
    if (result.exists) {
      setFoundPlayer(result.player)
      setPhase('confirm')
    } else {
      setPlayerName(name)
      startIntro()
    }
  }

  const confirmPlay = () => {
    setPlayerName((nameInput || '').trim().slice(0, 14).toUpperCase())
    startIntro()
  }

  const cancelPlay = () => {
    setPhase('idle')
    setFoundPlayer(null)
    setNameInput('')
    setNameMsg('')
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-[#07070f] relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* ── backgrounds ── */}
      <Particles />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage:'linear-gradient(#00f5ff 1px,transparent 1px),linear-gradient(90deg,#00f5ff 1px,transparent 1px)', backgroundSize:'90px 90px' }}
      />
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)' }}
      />
      <div ref={glowRef} className="absolute pointer-events-none rounded-full"
        style={{
          width:'70vw', height:'70vw', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          background:'radial-gradient(circle,rgba(0,180,210,0.09) 0%,rgba(255,106,0,0.035) 55%,transparent 72%)',
          opacity:0.08,
        }}
      />
      {/* Corner brackets */}
      {['top-3 left-3 border-t-2 border-l-2','top-3 right-3 border-t-2 border-r-2',
        'bottom-3 left-3 border-b-2 border-l-2','bottom-3 right-3 border-b-2 border-r-2'].map((c) => (
        <div key={c} className={`absolute w-6 h-6 ${c} z-20`} style={{ borderColor:'#00f5ff1a' }} />
      ))}

      {/* ── content ── */}
      <div className="relative z-20 flex flex-col items-center px-5 w-full max-w-[580px]">

        {/* Title */}
        <div ref={titleRef} className="text-center mb-0.5" style={{ opacity:0 }}>
          <h1 className="font-mono font-black tracking-[0.2em] leading-none"
            style={{
              fontSize:'clamp(2rem,7vw,3.5rem)',
              color:'#00f5ff',
              textShadow:'0 0 40px rgba(0,245,255,0.5),0 0 80px rgba(0,245,255,0.15)',
            }}>
            AI UPRISING
          </h1>
        </div>
        <div ref={subRef} className="text-center mb-2.5" style={{ opacity:0 }}>
          <h2 className="font-mono font-bold tracking-[0.5em] text-white"
            style={{ fontSize:'clamp(0.7rem,2.2vw,1.1rem)', textShadow:'0 0 20px rgba(255,255,255,0.12)' }}>
            LAST ESCAPE
          </h2>
        </div>

        <p ref={taglineRef} className="font-mono font-bold tracking-[0.22em] text-xs mb-3.5"
          style={{ color:'#ff6a00', opacity:0 }}>
          STAY CONNECTED · KEEP MOVING · END CORE
        </p>

        <div ref={dividerRef} className="h-px w-full mb-3.5"
          style={{ background:'linear-gradient(90deg,transparent,#00f5ff18,#ffffff12,#00f5ff18,transparent)', opacity:0 }} />

        {/* Lore */}
        <p ref={loreRef} className="font-mono text-sm text-center leading-relaxed mb-3.5 max-w-sm"
          style={{ color:'#777', opacity:0 }}>
          CORE went rogue — every grid locked down. Counter-code{' '}
          <span style={{ color:'#00f5ff' }}>SIGNAL-0</span> can end it.
          {' '}Upload from a fixed point and you're triangulated. <span className="text-white">Upload on the move.</span>
        </p>

        {/* Zone chips */}
        <div ref={zonesRef} className="flex gap-1.5 mb-4 w-full" style={{ opacity:0 }}>
          {[
            { n:'01', label:'WASTELAND', col:'#ff6a00' },
            { n:'02', label:'INDUSTRIAL', col:'#00ff88' },
            { n:'03', label:'AI CORE',   col:'#ff2020' },
          ].map((z) => (
            <div key={z.n} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border rounded-sm"
              style={{ borderColor: z.col + '30', background: z.col + '09' }}>
              <span className="font-mono text-xs font-black" style={{ color: z.col }}>{z.n}</span>
              <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color: z.col + 'bb' }}>{z.label}</span>
            </div>
          ))}
        </div>

        {/* ── Two-column section: callsign + leaderboard ── */}
        <div ref={middleRef} className="flex gap-3 w-full mb-3" style={{ opacity:0 }}>

          {/* Left: callsign input */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold tracking-[0.4em] text-[#555]">YOUR CALLSIGN</span>
              <div className="flex-1 h-px" style={{ background:'#ffffff0a' }} />
            </div>
            <input
              type="text"
              maxLength={14}
              value={nameInput}
              disabled={phase === 'confirm'}
              onChange={(e) => { setNameInput(e.target.value.toUpperCase()); setNameMsg('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && isValidName && phase === 'idle') beginWithName() }}
              placeholder="ENTER NAME"
              className="w-full bg-transparent border px-3 py-2.5 font-mono text-base md:text-sm tracking-widest outline-none transition-all duration-200 disabled:opacity-40"
              style={{
                borderColor: phase === 'confirm' ? '#ffffff18' : isValidName ? '#00f5ff44' : '#ffffff18',
                color: '#00f5ff',
                caretColor: '#00f5ff',
              }}
            />
            {/* status line */}
            <div className="mt-1.5 h-4">
            {nameMsg ? (
              <p className="font-mono text-xs font-bold tracking-widest text-[#ff4444]">{nameMsg}</p>
            ) : isValidName && phase !== 'confirm' && nameInput.trim().toUpperCase() === playerName ? (
              <p className="font-mono text-xs font-bold tracking-widest" style={{ color:'#00ff88' }}>
                ✓ WELCOME BACK, {playerName}
              </p>
            ) : isValidName && phase !== 'confirm' ? (
              <p className="font-mono text-xs font-semibold tracking-widest" style={{ color:'#00f5ff66' }}>
                ✓ {nameInput.trim()}
              </p>
            ) : !isValidName ? (
              <p className="font-mono text-xs tracking-widest text-[#333]">MIN 3 CHARACTERS</p>
            ) : null}
            </div>
          </div>

          {/* Right: top 5 */}
          <div className="w-[170px] shrink-0">
            <LeaderboardPanel />
          </div>
        </div>

        {/* ── Action area ── */}
        <div ref={actionRef} className="w-full mb-3" style={{ opacity:0 }}>
          {phase === 'confirm' && foundPlayer ? (
            <ConfirmCard player={foundPlayer} onConfirm={confirmPlay} onCancel={cancelPlay} />
          ) : phase === 'checking' ? (
            <div className="w-full border py-3 flex items-center justify-center gap-3 mb-3"
              style={{ borderColor:'#ffffff10', background:'rgba(255,255,255,0.02)' }}>
              <span className="font-mono text-sm font-bold tracking-[0.4em] text-[#555] animate-pulse">… VERIFYING CALLSIGN</span>
            </div>
          ) : isValidName ? (
            <button
              ref={btnRef}
              onClick={beginWithName}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              className="w-full font-mono font-bold tracking-[0.4em] text-sm py-3.5 relative overflow-hidden transition-all duration-150 active:scale-[0.98] mb-3"
              style={{
                opacity: 0,
                border: '2px solid #00f5ff',
                color: btnHover ? '#000' : '#00f5ff',
                background: btnHover ? '#00f5ff' : 'rgba(0,245,255,0.05)',
              }}
            >
              {btnHover && (
                <>
                  <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-black" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-black" />
                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-black" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-black" />
                </>
              )}
              ▶ BEGIN UPLOAD
            </button>
          ) : (
            <div className="w-full border py-3 flex items-center justify-center mb-3"
              style={{ borderColor:'#ffffff08', background:'rgba(255,255,255,0.015)' }}>
              <span className="font-mono text-sm font-semibold tracking-[0.4em] text-[#2a2a2a]">ENTER CALLSIGN TO START</span>
            </div>
          )}
        </div>

        {/* ── Bottom row ── */}
        <div ref={bottomRef} className="flex items-center justify-between w-full" style={{ opacity:0 }}>
          <div className="flex gap-1.5 flex-wrap">
            {[['←→','LANE'],['↑','JUMP'],['Z','FIRE'],['P','PAUSE']].map(([k, v]) => (
              <div key={k} className="flex items-center gap-1 border rounded-sm px-1.5 py-0.5"
                style={{ borderColor:'#1e1e1e' }}>
                <span className="font-mono text-[9px] text-[#444]">{k}</span>
                <span className="font-mono text-[8px] text-[#2a2a2a]">{v}</span>
              </div>
            ))}
          </div>
          {highScore > 0 && (
            <div className="flex items-center gap-1.5 ml-4 shrink-0">
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#444]">LOCAL BEST</span>
              <span className="font-mono text-sm font-black" style={{ color:'#ff6a00' }}>
                {highScore.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fdot {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-18px) scale(1.3); }
        }
      `}</style>
    </div>
  )
}
