import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'
import LeaderboardService from '../services/LeaderboardService'

function GreenParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => {
        const size  = 1 + Math.random() * 3
        const left  = Math.random() * 100
        const top   = 5 + Math.random() * 90
        const dur   = 4 + Math.random() * 8
        const delay = Math.random() * 6
        const color = i % 4 === 0 ? '#00f5ff' : '#00ff88'
        return (
          <div key={i} className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: `${left}%`, top: `${top}%`,
              backgroundColor: color,
              opacity: 0.1 + Math.random() * 0.3,
              animation: `float-up ${dur}s ${delay}s ease-in-out infinite alternate`,
            }}
          />
        )
      })}
    </div>
  )
}

export default function Victory() {
  const score     = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const kills     = useGameStore((s) => s.kills)
  const distance  = useGameStore((s) => s.distance)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu  = useGameStore((s) => s.goToMenu)
  const playerName = useGameStore((s) => s.playerName)

  const containerRef = useRef(null)
  const flashRef     = useRef(null)
  const ring1Ref     = useRef(null)
  const ring2Ref     = useRef(null)
  const ring3Ref     = useRef(null)
  const uploadRef    = useRef(null)
  const titleRef     = useRef(null)
  const subtitleRef  = useRef(null)
  const tagRef       = useRef(null)
  const zonesRef     = useRef(null)
  const statsRef     = useRef(null)
  const btnsRef      = useRef(null)
  const scoreValRef  = useRef(null)
  const distValRef   = useRef(null)
  const killsValRef  = useRef(null)

  const isNewRecord = score >= highScore && score > 0

  const [submitState, setSubmitState] = useState('idle')

  useEffect(() => {
    const tl = gsap.timeline()

    tl.set(containerRef.current, { opacity: 1 })
      // Energy flash burst
      .fromTo(flashRef.current,
        { opacity: 0.95, scale: 0.4 },
        { opacity: 0, scale: 3.5, duration: 0.9, ease: 'power2.out' }
      )
      // Pulse rings
      .fromTo([ring1Ref.current, ring2Ref.current, ring3Ref.current],
        { scale: 0, opacity: 0.8 },
        { scale: 5, opacity: 0, duration: 1.4, ease: 'power1.out', stagger: 0.18 }, '<0.1'
      )
      // Upload label sweeps in
      .fromTo(uploadRef.current,
        { scaleX: 0, opacity: 0, transformOrigin: 'center' },
        { scaleX: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.9'
      )
      // SIGNAL-0 title slams in
      .fromTo(titleRef.current,
        { y: 50, opacity: 0, scale: 0.55 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: 'back.out(2)' }, '-=0.2'
      )
      .fromTo(subtitleRef.current,
        { opacity: 0, letterSpacing: '1.2em' },
        { opacity: 1, letterSpacing: '0.35em', duration: 0.5, ease: 'power2.out' }, '-=0.1'
      )
      .fromTo(tagRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4 }, '-=0.1'
      )
      // Zone checkmarks
      .fromTo(zonesRef.current?.children ?? [],
        { opacity: 0, y: 12, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.12, ease: 'back.out(1.5)' }, '-=0.1'
      )
      // Stats
      .fromTo(statsRef.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.1')

    const scoreObj = { val: 0 }
    tl.to(scoreObj, { val: score, duration: 1.2, ease: 'power2.out',
      onUpdate: () => { if (scoreValRef.current) scoreValRef.current.textContent = Math.floor(scoreObj.val).toLocaleString() }
    }, '-=0.1')
    const distObj = { val: 0 }
    tl.to(distObj, { val: Math.floor(distance), duration: 1.0, ease: 'power2.out',
      onUpdate: () => { if (distValRef.current) distValRef.current.textContent = Math.floor(distObj.val).toLocaleString() + 'm' }
    }, '<')
    const killsObj = { val: 0 }
    tl.to(killsObj, { val: kills, duration: 0.8, ease: 'power2.out',
      onUpdate: () => { if (killsValRef.current) killsValRef.current.textContent = Math.floor(killsObj.val) }
    }, '<')

    tl.fromTo(btnsRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.2')

    // Ambient title pulse
    gsap.to(titleRef.current, {
      textShadow: '0 0 60px #00ff8888, 0 0 120px #00ff8844',
      repeat: -1, yoyo: true, duration: 2, ease: 'sine.inOut', delay: 1.5
    })

    return () => { tl.kill(); gsap.killTweensOf(titleRef.current) }
  }, [])

  useEffect(() => {
    if (!playerName || submitState !== 'idle') return
    let mounted = true
    ;(async () => {
      setSubmitState('submitting')
      await LeaderboardService.updatePlayerResult({ name: playerName, score, kills, distance })
      if (mounted) setSubmitState('done')
    })()
    return () => { mounted = false }
  }, [playerName, score, kills, distance, submitState])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center bg-[#020d05] relative overflow-hidden"
      style={{ opacity: 0 }}>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />
      <GreenParticles />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,0.025) 3px,rgba(0,255,136,0.025) 4px)' }}
      />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,136,0.11) 0%, transparent 60%)' }}
      />

      {/* Flash burst */}
      <div ref={flashRef} className="absolute rounded-full pointer-events-none"
        style={{ width:'300px', height:'300px', background:'radial-gradient(circle, #00ff88cc 0%, transparent 70%)', opacity:0 }}
      />

      {/* Pulse rings */}
      {[ring1Ref, ring2Ref, ring3Ref].map((r, i) => (
        <div key={i} ref={r} className="absolute rounded-full pointer-events-none"
          style={{ width:'180px', height:'180px', border:`2px solid #00ff88`, boxShadow:'0 0 20px #00ff8866', opacity:0 }}
        />
      ))}

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00ff88]/30 z-20" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00ff88]/30 z-20" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00ff88]/30 z-20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00ff88]/30 z-20" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-4">

        {/* Upload complete label */}
        <p ref={uploadRef} className="font-mono font-bold tracking-[0.5em] text-base mb-4 uppercase"
          style={{ color:'#00ff88', opacity:0 }}>
          ✓ UPLOAD COMPLETE
        </p>

        {/* Title */}
        <div ref={titleRef} className="text-center mb-1" style={{ opacity:0 }}>
          <h1 className="font-mono font-black tracking-[0.2em] leading-none text-white"
            style={{ fontSize:'clamp(2.6rem,10vw,5rem)', textShadow:'0 0 40px #00ff8888' }}>
            SIGNAL-0
          </h1>
        </div>
        <h2 ref={subtitleRef} className="font-mono font-bold text-[#00f5ff] mb-3"
          style={{ fontSize:'clamp(1rem,3vw,1.8rem)', opacity:0 }}>
          DELIVERED
        </h2>

        <div ref={tagRef} className="text-center mb-5" style={{ opacity:0 }}>
          <p className="font-mono text-[#00ff88] text-base font-bold tracking-widest">CORE HAS BEEN NEUTRALIZED</p>
          <p className="font-mono text-[#558855] text-sm font-semibold tracking-widest mt-1">HUMANITY IS FREE</p>
        </div>

        {/* Zone completion badges */}
        <div ref={zonesRef} className="flex gap-3 mb-5">
          {[
            { n:'01', label:'WASTELAND', color:'#ff6a00' },
            { n:'02', label:'INDUSTRIAL', color:'#00ff88' },
            { n:'03', label:'CORE', color:'#ff2020' },
          ].map((z) => (
            <div key={z.n} className="flex flex-col items-center px-3 py-2 border rounded-sm"
              style={{ borderColor: z.color + '40', background: z.color + '0a', opacity:0 }}>
              <span className="font-mono text-sm font-bold tracking-widest mb-1" style={{ color: z.color + 'cc' }}>ZONE {z.n}</span>
              <span className="font-mono font-black text-lg" style={{ color: z.color }}>✓</span>
              <span className="font-mono text-xs font-semibold tracking-wider mt-1" style={{ color: z.color + 'aa' }}>{z.label}</span>
            </div>
          ))}
        </div>

        {isNewRecord && (
          <div className="mb-4 px-4 py-2 border font-mono text-sm font-bold tracking-[0.4em] text-[#ff6a00]"
            style={{ borderColor:'#ff6a0040' }}>
            ★ NEW HIGH SCORE ★
          </div>
        )}

        {/* Stats */}
        <div ref={statsRef} className="w-full border mb-5" style={{ opacity:0, borderColor:'#0a2014', background:'rgba(0,40,20,0.2)' }}>
          {[
            { label:'SCORE', ref: scoreValRef, color:'#fff' },
            { label:'BEST',  staticVal: highScore.toLocaleString(), color:'#ff6a00' },
            { label:'DISTANCE', ref: distValRef, color:'#fff' },
            { label:'KILLS', ref: killsValRef, color:'#00ff88' },
          ].map(({ label, ref: vRef, staticVal, color }, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-4 border-b last:border-0"
              style={{ borderColor:'#0a2014' }}>
              <span className="font-mono text-base font-bold tracking-[0.3em] text-[#5a9a6a]">{label}</span>
              {staticVal
                ? <span className="font-mono text-lg font-black" style={{ color }}>{staticVal}</span>
                : <span ref={vRef} className="font-mono text-lg font-black" style={{ color }}>0</span>
              }
            </div>
          ))}
        </div>

        {submitState === 'submitting' && (
          <p className="font-mono text-sm font-bold tracking-[0.4em] text-[#00f5ff] mb-4 text-center">UPDATING PLAYER…</p>
        )}
        {submitState === 'done' && (
          <p className="font-mono text-sm font-bold tracking-[0.4em] text-[#00ff88] mb-4 text-center">✓ PLAYER STATS UPDATED</p>
        )}

        {/* Buttons */}
        <div ref={btnsRef} className="flex flex-col gap-3 w-full" style={{ opacity:0 }}>
          <button onClick={startGame}
            className="font-mono font-bold tracking-[0.25em] text-lg py-4 border-2 border-[#00ff88] text-[#00ff88]
                       hover:bg-[#00ff88] hover:text-black transition-all duration-200 active:scale-95"
            style={{ boxShadow:'0 0 18px rgba(0,255,136,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 32px rgba(0,255,136,0.6)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 18px rgba(0,255,136,0.3)'}>
            ▶ PLAY AGAIN
          </button>
          <button onClick={goToMenu}
            className="font-mono font-bold tracking-[0.25em] text-lg py-4 border border-[#444] text-[#888]
                       hover:border-[#888] hover:text-white transition-all duration-200 active:scale-95">
            MAIN MENU
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float-up { from { transform: translateY(0); } to { transform: translateY(-20px); } }
      `}</style>
    </div>
  )
}
