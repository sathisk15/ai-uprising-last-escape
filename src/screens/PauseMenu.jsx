import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'

export default function PauseMenu() {
  const resumeGame = useGameStore((s) => s.resumeGame)
  const goToMenu   = useGameStore((s) => s.goToMenu)
  const score      = useGameStore((s) => s.score)
  const zone       = useGameStore((s) => s.zone)
  const health     = useGameStore((s) => s.health)
  const energy     = useGameStore((s) => s.energy)
  const kills      = useGameStore((s) => s.kills)
  const ammo       = useGameStore((s) => s.ammo)

  const overlayRef = useRef(null)
  const panelRef   = useRef(null)
  const titleRef   = useRef(null)
  const statsRef   = useRef(null)
  const btnsRef    = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo(panelRef.current,
        { scale: 0.88, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.6)' }, '-=0.1'
      )
      .fromTo(titleRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.25 }, '-=0.15'
      )
      .fromTo(statsRef.current?.children ?? [],
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.25, stagger: 0.06 }, '-=0.1'
      )
      .fromTo(btnsRef.current?.children ?? [],
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.22, stagger: 0.07 }, '-=0.1'
      )

    return () => tl.kill()
  }, [])

  const healthColor = health > 60 ? '#00ff88' : health > 30 ? '#ffaa00' : '#ff2020'
  const energyColor = energy > 40 ? '#00f5ff' : energy > 20 ? '#ffaa00' : '#ff2020'

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ opacity: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      {/* Scanlines over the blur */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)' }}
      />

      <div
        ref={panelRef}
        className="relative font-mono w-72 border"
        style={{ opacity:0, background:'rgba(5,5,16,0.97)', borderColor:'#00f5ff22' }}
      >
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-[#00f5ff]/40" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-[#00f5ff]/40" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-[#00f5ff]/40" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-[#00f5ff]/40" />

        {/* Header */}
        <div ref={titleRef} className="border-b px-6 py-4 text-center" style={{ borderColor:'#0d0d2a', opacity:0 }}>
          <p className="text-[#00f5ff]/30 tracking-[0.5em] text-[9px] mb-1">— SIGNAL PAUSED —</p>
          <h1 className="text-[#00f5ff] tracking-[0.4em] text-xl font-bold">PAUSED</h1>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="px-6 py-4 flex flex-col gap-3 border-b" style={{ borderColor:'#0d0d2a' }}>

          {/* Health bar */}
          <div>
            <div className="flex justify-between text-[10px] tracking-widest mb-1">
              <span className="text-[#333]">HULL</span>
              <span style={{ color: healthColor }}>{Math.round(health)}%</span>
            </div>
            <div className="h-1.5 bg-[#0a0a0a] rounded-sm overflow-hidden">
              <div className="h-full rounded-sm transition-all duration-500"
                style={{ width:`${health}%`, backgroundColor: healthColor, boxShadow:`0 0 6px ${healthColor}` }}
              />
            </div>
          </div>

          {/* Energy bar */}
          <div>
            <div className="flex justify-between text-[10px] tracking-widest mb-1">
              <span className="text-[#333]">ENERGY</span>
              <span style={{ color: energyColor }}>{Math.round(energy)}%</span>
            </div>
            <div className="h-1.5 bg-[#0a0a0a] rounded-sm overflow-hidden">
              <div className="h-full rounded-sm transition-all duration-500"
                style={{ width:`${energy}%`, backgroundColor: energyColor, boxShadow:`0 0 6px ${energyColor}` }}
              />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex gap-2 mt-1">
            {[
              { label: 'ZONE',  value: zone,                      color: '#ff6a00' },
              { label: 'KILLS', value: kills,                     color: '#00ff88' },
              { label: 'AMMO',  value: ammo,                      color: '#00f5ff' },
              { label: 'SCORE', value: Math.floor(score / 1000) + 'K', color: '#aaa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 text-center py-2 border rounded-sm" style={{ borderColor:'#0d0d22', background:'rgba(255,255,255,0.02)' }}>
                <p className="text-[8px] tracking-widest text-[#2a2a2a] mb-0.5">{label}</p>
                <p className="text-sm font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div ref={btnsRef} className="px-6 py-4 flex flex-col gap-2.5">
          <button onClick={resumeGame}
            className="tracking-[0.3em] text-sm py-3 border-2 border-[#00f5ff] text-[#00f5ff]
                       hover:bg-[#00f5ff] hover:text-black transition-all duration-150 active:scale-95 font-mono"
            style={{ boxShadow:'0 0 14px rgba(0,245,255,0.2)', opacity:0 }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 24px rgba(0,245,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 14px rgba(0,245,255,0.2)'}>
            ▶ RESUME
          </button>
          <button onClick={goToMenu}
            className="tracking-[0.3em] text-sm py-3 border border-[#1e1e1e] text-[#444]
                       hover:border-[#444] hover:text-white transition-all duration-150 active:scale-95 font-mono"
            style={{ opacity:0 }}>
            MAIN MENU
          </button>
          <p className="text-[#1e1e1e] text-[9px] tracking-widest text-center mt-1">P / ESC TO RESUME</p>
        </div>
      </div>
    </div>
  )
}
