import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../store/gameStore'
import ProceduralBGM from '../audio/ProceduralBGM'

export default function PauseMenu() {
  const resumeGame      = useGameStore((s) => s.resumeGame)
  const goToMenu        = useGameStore((s) => s.goToMenu)
  const score           = useGameStore((s) => s.score)
  const zone            = useGameStore((s) => s.zone)
  const health          = useGameStore((s) => s.health)
  const energy          = useGameStore((s) => s.energy)
  const kills           = useGameStore((s) => s.kills)
  const ammo            = useGameStore((s) => s.ammo)
  const masterVolume    = useGameStore((s) => s.masterVolume)
  const sfxVolume       = useGameStore((s) => s.sfxVolume)
  const audioEnabled    = useGameStore((s) => s.audioEnabled)
  const setMasterVolume = useGameStore((s) => s.setMasterVolume)
  const setSfxVolume    = useGameStore((s) => s.setSfxVolume)
  const setAudioEnabled = useGameStore((s) => s.setAudioEnabled)

  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef(null)

  const overlayRef = useRef(null)
  const panelRef   = useRef(null)
  const titleRef   = useRef(null)
  const statsRef   = useRef(null)
  const optsRef    = useRef(null)
  const btnsRef    = useRef(null)

  const triggerSaved = () => {
    setShowSaved(true)
    clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 1600)
  }

  const handleBGMChange = (v) => {
    setMasterVolume(v)
    ProceduralBGM.setVolume(v)
    triggerSaved()
  }

  const handleSFXChange = (v) => {
    setSfxVolume(v)
    triggerSaved()
  }

  const handleMuteToggle = () => {
    setAudioEnabled(!audioEnabled)
    triggerSaved()
  }

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
      .fromTo(optsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }, '-=0.1'
      )
      .fromTo(btnsRef.current?.children ?? [],
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.22, stagger: 0.07 }, '-=0.1'
      )

    return () => { tl.kill(); clearTimeout(savedTimerRef.current) }
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
          <p className="text-[#00f5ff]/50 tracking-[0.5em] text-xs mb-1">— SIGNAL PAUSED —</p>
          <h1 className="text-[#00f5ff] tracking-[0.4em] text-xl font-bold">PAUSED</h1>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="px-6 py-4 flex flex-col gap-3 border-b" style={{ borderColor:'#0d0d2a' }}>

          {/* Health bar */}
          <div>
            <div className="flex justify-between text-sm tracking-widest mb-1">
              <span className="text-[#888]">HULL</span>
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
            <div className="flex justify-between text-sm tracking-widest mb-1">
              <span className="text-[#888]">ENERGY</span>
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
                <p className="text-[11px] tracking-widest text-[#666] mb-0.5">{label}</p>
                <p className="text-base font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audio options */}
        <div ref={optsRef} className="px-6 py-4 border-b" style={{ borderColor:'#0d0d2a', opacity:0 }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="font-mono text-[#555] text-[10px] tracking-[0.4em]">AUDIO SETTINGS</p>
            <button onClick={handleMuteToggle}
              className="font-mono text-[10px] tracking-widest px-2 py-0.5 border transition-all duration-150"
              style={{
                borderColor: audioEnabled ? '#00f5ff40' : '#ff202040',
                color: audioEnabled ? '#00f5ff' : '#ff4444',
                background: audioEnabled ? 'rgba(0,245,255,0.05)' : 'rgba(255,32,32,0.05)',
              }}>
              {audioEnabled ? '◉ ON' : '○ OFF'}
            </button>
          </div>

          {/* BGM slider */}
          <div className="mb-2.5">
            <div className="flex justify-between font-mono text-[11px] mb-1">
              <span className="text-[#888] tracking-widest">BGM</span>
              <span className="text-[#00f5ff]">{Math.round((masterVolume ?? 0.7) * 100)}%</span>
            </div>
            <input type="range" min="0" max="100"
              value={Math.round((masterVolume ?? 0.7) * 100)}
              onChange={(e) => handleBGMChange(Number(e.target.value) / 100)}
              className="w-full h-1 rounded-none outline-none cursor-pointer"
              style={{ accentColor: '#00f5ff' }}
            />
          </div>

          {/* SFX slider */}
          <div>
            <div className="flex justify-between font-mono text-[11px] mb-1">
              <span className="text-[#888] tracking-widest">SFX</span>
              <span className="text-[#ff6a00]">{Math.round((sfxVolume ?? 0.7) * 100)}%</span>
            </div>
            <input type="range" min="0" max="100"
              value={Math.round((sfxVolume ?? 0.7) * 100)}
              onChange={(e) => handleSFXChange(Number(e.target.value) / 100)}
              className="w-full h-1 rounded-none outline-none cursor-pointer"
              style={{ accentColor: '#ff6a00' }}
            />
          </div>

          {/* Save indicator */}
          <p className="font-mono text-[10px] tracking-[0.4em] text-center mt-2 transition-opacity duration-300"
            style={{ color:'#00f5ff', opacity: showSaved ? 1 : 0 }}>
            ✓ SETTINGS SAVED
          </p>
        </div>

        {/* Buttons */}
        <div ref={btnsRef} className="px-6 py-4 flex flex-col gap-2.5">
          <button onClick={resumeGame}
            className="tracking-[0.3em] text-base py-3 border-2 border-[#00f5ff] text-[#00f5ff]
                       hover:bg-[#00f5ff] hover:text-black transition-all duration-150 active:scale-95 font-mono"
            style={{ boxShadow:'0 0 14px rgba(0,245,255,0.2)', opacity:0 }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 24px rgba(0,245,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 14px rgba(0,245,255,0.2)'}>
            ▶ RESUME
          </button>
          <button onClick={goToMenu}
            className="tracking-[0.3em] text-base py-3 border border-[#333] text-[#777]
                       hover:border-[#777] hover:text-white transition-all duration-150 active:scale-95 font-mono"
            style={{ opacity:0 }}>
            MAIN MENU
          </button>
          <p className="text-[#555] text-xs tracking-widest text-center mt-1">P / ESC TO RESUME · F TO TOGGLE FULLSCREEN</p>
        </div>
      </div>
    </div>
  )
}
