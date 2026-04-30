import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'
import LeaderboardService from '../services/LeaderboardService'

function RedParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => {
        const size  = 1 + Math.random() * 2
        const left  = Math.random() * 100
        const top   = 10 + Math.random() * 80
        const dur   = 5 + Math.random() * 7
        const delay = Math.random() * 5
        return (
          <div key={i} className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: `${left}%`, top: `${top}%`,
              backgroundColor: '#ff2020',
              opacity: 0.1 + Math.random() * 0.2,
              animation: `float-dot ${dur}s ${delay}s ease-in-out infinite alternate`,
            }}
          />
        )
      })}
    </div>
  )
}

export default function GameOver() {
  const score     = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const kills     = useGameStore((s) => s.kills)
  const distance  = useGameStore((s) => s.distance)
  const zone      = useGameStore((s) => s.zone)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu  = useGameStore((s) => s.goToMenu)

  const overlayRef  = useRef(null)
  const flashRef    = useRef(null)
  const noiseRef    = useRef(null)
  const titleRef    = useRef(null)
  const ghostRedRef = useRef(null)
  const ghostCynRef = useRef(null)
  const subRef      = useRef(null)
  const zoneRef     = useRef(null)
  const statsRef    = useRef(null)
  const btnsRef     = useRef(null)
  const glitchTimer = useRef(null)
  const scoreValRef = useRef(null)
  const distValRef  = useRef(null)
  const killsValRef = useRef(null)

  const isNewRecord = score > 0 && score >= highScore

  const [callsign,    setCallsign]    = useState('')
  const [submitState, setSubmitState] = useState('idle') // 'idle' | 'submitting' | 'done' | 'skipped'

  const handleSubmit = async () => {
    setSubmitState('submitting')
    await LeaderboardService.submitScore({ name: callsign, score, zone, kills, distance })
    setSubmitState('done')
  }

  useEffect(() => {
    const tl = gsap.timeline()

    tl.set(overlayRef.current, { opacity: 1 })
      // Red flash strobe
      .fromTo(flashRef.current, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'power2.out' })
      .to(flashRef.current, { opacity: 0.6, duration: 0.05 })
      .to(flashRef.current, { opacity: 0,   duration: 0.08 })
      .to(flashRef.current, { opacity: 0.3, duration: 0.04 })
      .to(flashRef.current, { opacity: 0,   duration: 0.12 })

      // Static noise flicker
      .fromTo(noiseRef.current, { opacity: 0.4 }, { opacity: 0, duration: 0.6, ease: 'power2.in' }, '-=0.3')

      // Chromatic title slam
      .fromTo([ghostRedRef.current, ghostCynRef.current],
        { y: -80, opacity: 0, skewX: 15 },
        { y: 0, opacity: 0.55, skewX: 0, duration: 0.35, ease: 'power4.out', stagger: 0.04 }, '-=0.2'
      )
      .fromTo(titleRef.current,
        { y: -80, opacity: 0, skewX: 8 },
        { y: 0, opacity: 1, skewX: 0, duration: 0.35, ease: 'power4.out' }, '<0.04'
      )
      .to(ghostRedRef.current, { x: 0, y: 0, opacity: 0, duration: 0.25 }, '-=0.1')
      .to(ghostCynRef.current, { x: 0, y: 0, opacity: 0, duration: 0.25 }, '<')

      // Subtitle + zone badge
      .fromTo(subRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3 }, '-=0.1')
      .fromTo(zoneRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.1')

      // Stats cards slide up
      .fromTo(statsRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.1')

    // Count-up
    const scoreObj = { val: 0 }
    tl.to(scoreObj, { val: score, duration: 1.0, ease: 'power2.out',
      onUpdate: () => { if (scoreValRef.current) scoreValRef.current.textContent = Math.floor(scoreObj.val).toLocaleString() }
    }, '-=0.1')
    const distObj = { val: 0 }
    tl.to(distObj, { val: Math.floor(distance), duration: 0.9, ease: 'power2.out',
      onUpdate: () => { if (distValRef.current) distValRef.current.textContent = Math.floor(distObj.val).toLocaleString() + 'm' }
    }, '<')
    const killsObj = { val: 0 }
    tl.to(killsObj, { val: kills, duration: 0.7, ease: 'power2.out',
      onUpdate: () => { if (killsValRef.current) killsValRef.current.textContent = Math.floor(killsObj.val) }
    }, '<')

    tl.fromTo(btnsRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2')

    // Periodic glitch
    glitchTimer.current = setInterval(() => {
      if (!titleRef.current) return
      const seq = gsap.timeline()
      seq.to([ghostRedRef.current, ghostCynRef.current], { opacity: 0.4, duration: 0.02 })
        .to(ghostRedRef.current, { x: gsap.utils.random(-8,8), y: gsap.utils.random(-3,3), duration: 0.04 })
        .to(ghostCynRef.current, { x: gsap.utils.random(-8,8), y: gsap.utils.random(-3,3), duration: 0.04 }, '<')
        .to(titleRef.current, { skewX: gsap.utils.random(-4,4), duration: 0.04 }, '<')
        .to([ghostRedRef.current, ghostCynRef.current], { opacity: 0, duration: 0.08 })
        .to(titleRef.current, { skewX: 0, duration: 0.06 }, '<')
        .to([ghostRedRef.current, ghostCynRef.current], { x: 0, y: 0, duration: 0 })
    }, 2800)

    return () => { tl.kill(); clearInterval(glitchTimer.current) }
  }, [])

  const STAT = (label, valRef, accent) => (
    <div className="flex items-center justify-between py-2.5 px-4 border-b last:border-0"
      style={{ borderColor: '#1a0404' }}>
      <span className="font-mono text-sm tracking-[0.3em]" style={{ color: '#aa5555' }}>{label}</span>
      <span ref={valRef} className="font-mono text-base" style={{ color: accent ?? '#ccc' }}>0</span>
    </div>
  )

  return (
    <div ref={overlayRef} className="w-full h-full flex flex-col items-center justify-center bg-[#050005] relative overflow-hidden"
      style={{ opacity: 0 }}>

      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#ff2020 1px, transparent 1px), linear-gradient(90deg, #ff2020 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />
      <RedParticles />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,0,0,0.03) 3px,rgba(255,0,0,0.03) 4px)' }}
      />

      {/* Red radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(200,0,0,0.13) 0%, transparent 60%)' }}
      />

      {/* Flash overlay */}
      <div ref={flashRef} className="absolute inset-0 pointer-events-none" style={{ background: '#ff0000', opacity: 0 }} />

      {/* Static noise */}
      <div ref={noiseRef} className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
          backgroundSize: '128px', mixBlendMode: 'overlay', opacity: 0,
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#ff2020]/30 z-20" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#ff2020]/30 z-20" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#ff2020]/30 z-20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#ff2020]/30 z-20" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-4">

        {/* Chromatic title */}
        <div className="relative text-center mb-2">
          <h1 ref={ghostRedRef} className="absolute inset-0 font-mono font-black tracking-widest leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(2.2rem,9vw,4.5rem)', color:'#ff2020', transform:'translate(-6px,3px)', filter:'blur(1.5px)', opacity:0 }}>
            SIGNAL LOST
          </h1>
          <h1 ref={ghostCynRef} className="absolute inset-0 font-mono font-black tracking-widest leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(2.2rem,9vw,4.5rem)', color:'#00f5ff', transform:'translate(6px,-3px)', filter:'blur(1.5px)', opacity:0 }}>
            SIGNAL LOST
          </h1>
          <h1 ref={titleRef} className="relative font-mono font-black tracking-widest leading-none"
            style={{ fontSize: 'clamp(2.2rem,9vw,4.5rem)', color:'#ff2020', textShadow:'0 0 30px #ff000088, 0 0 60px #ff000044', opacity:0 }}>
            SIGNAL LOST
          </h1>
        </div>

        <p ref={subRef} className="font-mono text-[#aa6666] tracking-[0.2em] text-sm mb-3 text-center" style={{ opacity:0 }}>
          UPLOAD ABORTED — CORE TRIANGULATED YOUR POSITION
        </p>

        {/* Zone reached badge */}
        <div ref={zoneRef} className="flex items-center gap-2 mb-5" style={{ opacity:0 }}>
          <div className="h-px w-8" style={{ background: '#ff2020' }} />
          <span className="font-mono text-sm tracking-[0.35em] px-3 py-1 border" style={{ color:'#ff6a00', borderColor:'#ff6a0060' }}>
            FELL IN ZONE {zone}
          </span>
          <div className="h-px w-8" style={{ background: '#ff2020' }} />
        </div>

        {/* Stats */}
        <div ref={statsRef} className="w-full border mb-5" style={{ opacity:0, borderColor:'#1a0404', background:'rgba(60,0,0,0.15)' }}>
          <div className="flex items-center justify-between py-2.5 px-4 border-b" style={{ borderColor:'#1a0404' }}>
            <span className="font-mono text-sm tracking-[0.3em] text-[#aa5555]">SCORE</span>
            <span ref={scoreValRef} className="font-mono text-base text-white">0</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-4 border-b" style={{ borderColor:'#1a0404' }}>
            <span className="font-mono text-sm tracking-[0.3em] text-[#aa5555]">BEST</span>
            <span className="font-mono text-sm" style={{ color: isNewRecord ? '#ff6a00' : '#ff6a00' }}>
              {highScore.toLocaleString()}{isNewRecord && ' ★'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-4 border-b" style={{ borderColor:'#1a0404' }}>
            <span className="font-mono text-sm tracking-[0.3em] text-[#aa5555]">DISTANCE</span>
            <span ref={distValRef} className="font-mono text-base text-white">0m</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-4">
            <span className="font-mono text-sm tracking-[0.3em] text-[#aa5555]">KILLS</span>
            <span ref={killsValRef} className="font-mono text-base text-[#ff6a00]">0</span>
          </div>
        </div>

        {/* Leaderboard submit */}
        {submitState === 'idle' && (
          <div className="w-full mb-4 border p-3" style={{ borderColor:'#2a0808', background:'rgba(40,0,0,0.2)' }}>
            <p className="font-mono text-[10px] tracking-[0.35em] text-[#aa5555] mb-2 text-center">
              SUBMIT TO GLOBAL RANKINGS
            </p>
            <input
              type="text" maxLength={14} placeholder="ENTER CALLSIGN"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
              className="w-full bg-transparent border px-3 py-1.5 font-mono text-sm text-white tracking-widest outline-none mb-2"
              style={{ borderColor:'#ff202040' }}
            />
            <div className="flex gap-2">
              <button onClick={handleSubmit}
                className="flex-1 font-mono text-xs tracking-[0.25em] py-1.5 border border-[#ff2020] text-[#ff2020]
                           hover:bg-[#ff2020] hover:text-black transition-all duration-150 active:scale-95">
                SUBMIT
              </button>
              <button onClick={() => setSubmitState('skipped')}
                className="font-mono text-xs tracking-[0.25em] px-4 py-1.5 border border-[#333] text-[#666]
                           hover:text-[#aaa] transition-all duration-150 active:scale-95">
                SKIP
              </button>
            </div>
          </div>
        )}
        {submitState === 'submitting' && (
          <p className="font-mono text-xs tracking-[0.4em] text-[#ff6a00] mb-4 text-center">TRANSMITTING…</p>
        )}
        {submitState === 'done' && (
          <p className="font-mono text-xs tracking-[0.4em] text-[#00ff88] mb-4 text-center">✓ SCORE SUBMITTED</p>
        )}

        {/* Buttons */}
        <div ref={btnsRef} className="flex flex-col gap-3 w-full" style={{ opacity:0 }}>
          <button onClick={startGame}
            className="font-mono tracking-[0.25em] text-base py-3.5 border-2 border-[#ff2020] text-[#ff2020] relative overflow-hidden
                       hover:bg-[#ff2020] hover:text-black transition-all duration-200 active:scale-95"
            style={{ boxShadow:'0 0 16px rgba(255,32,32,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 28px rgba(255,32,32,0.6)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 16px rgba(255,32,32,0.25)'}>
            ↺ RETRY UPLOAD
          </button>
          <button onClick={goToMenu}
            className="font-mono tracking-[0.25em] text-base py-3.5 border border-[#444] text-[#888]
                       hover:border-[#888] hover:text-white transition-all duration-200 active:scale-95">
            MAIN MENU
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float-dot { from { transform: translateY(0); } to { transform: translateY(-16px); } }
      `}</style>
    </div>
  )
}
