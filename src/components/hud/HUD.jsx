import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../../store/gameStore'
import { ZONES } from '../../game/zones'

// ── Health bar ────────────────────────────────────────────────────────────────
function HealthBar() {
  const health = useGameStore((s) => s.health)
  const barRef = useRef(null)
  const prevHealth = useRef(health)

  useEffect(() => {
    if (health < prevHealth.current && barRef.current) {
      gsap.fromTo(barRef.current, { opacity: 0.3 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    }
    prevHealth.current = health
  }, [health])

  const pct   = Math.max(0, health)
  const color = pct > 50 ? '#00ff88' : pct > 25 ? '#ffaa00' : '#ff2222'

  return (
    <div className="flex flex-col gap-1 w-[min(12rem,calc(100vw-9.85rem))] md:w-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] text-white/60 font-mono font-bold">HULL</span>
        <span className="text-xs tracking-widest font-mono font-bold" style={{ color }}>
          {Math.ceil(pct)}%
        </span>
      </div>
      <div className="w-full md:w-48 h-2 bg-white/10 rounded-sm overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-sm transition-all duration-200"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <div className="w-full md:w-48 flex justify-between px-0 -mt-1 pointer-events-none">
        {[25, 50, 75].map(tick => (
          <div key={tick} className="w-px h-1 bg-white/20" style={{ marginLeft: `${tick}%` }} />
        ))}
      </div>
    </div>
  )
}

// ── Energy bar ────────────────────────────────────────────────────────────────
function EnergyBar() {
  const energy = useGameStore((s) => s.energy)
  const pct    = Math.max(0, energy)
  const color  = pct > 40 ? '#00aaff' : pct > 20 ? '#ffaa00' : '#ff4400'

  return (
    <div className="flex flex-col gap-1 w-[min(12rem,calc(100vw-9.85rem))] md:w-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] text-white/60 font-mono font-bold">SIGNAL</span>
        <span className="text-xs tracking-widest font-mono font-bold" style={{ color }}>
          {Math.ceil(pct)}%
        </span>
      </div>
      <div className="w-full md:w-48 h-2 bg-white/10 rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  )
}

// ── Ammo display ──────────────────────────────────────────────────────────────
function AmmoDisplay() {
  const ammo  = useGameStore((s) => s.ammo)
  const color = ammo > 8 ? '#ffdd00' : ammo > 3 ? '#ff8800' : '#ff2222'

  const MAX_PIPS = 15
  const pips = Math.min(ammo, MAX_PIPS)

  return (
    <div className="flex flex-col gap-1 w-[min(12rem,calc(100vw-9.85rem))] md:w-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] text-white/60 font-mono font-bold">AMMO</span>
        <span className="text-xs tracking-widest font-mono font-bold" style={{ color }}>
          {ammo}{ammo > MAX_PIPS ? '+' : ''}
        </span>
      </div>
      <div className="flex w-full max-w-full flex-wrap gap-[3px] md:w-48">
        {Array.from({ length: MAX_PIPS }).map((_, i) => (
          <div
            key={i}
            className="w-[10px] h-[10px] rounded-sm transition-all duration-150"
            style={{
              background: i < pips ? color : 'rgba(255,255,255,0.07)',
              boxShadow: i < pips ? `0 0 4px ${color}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Boost indicator ───────────────────────────────────────────────────────────
function BoostIndicator() {
  const speedBoostActive = useGameStore((s) => s.speedBoostActive)
  const speedBoostTimer  = useGameStore((s) => s.speedBoostTimer)
  if (!speedBoostActive) return null
  const pct = Math.min(100, (speedBoostTimer / 6) * 100)
  return (
    <div
      className="flex flex-col gap-1 px-3 py-1 border font-mono"
      style={{ borderColor:'#ff8800', boxShadow:'0 0 10px #ff660066', background:'rgba(255,100,0,0.08)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] font-bold" style={{ color:'#ff8800' }}>▶▶ BOOST</span>
        <span className="text-xs tracking-widest font-bold" style={{ color:'#ffcc00' }}>{speedBoostTimer.toFixed(1)}s</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-100"
          style={{ width:`${pct}%`, background:'linear-gradient(90deg,#ff4400,#ffcc00)', boxShadow:'0 0 6px #ff8800' }}
        />
      </div>
    </div>
  )
}

// ── Shield indicator ──────────────────────────────────────────────────────────
function ShieldIndicator() {
  const shieldActive = useGameStore((s) => s.shieldActive)
  if (!shieldActive) return null
  return (
    <div
      className="flex items-center gap-2 px-3 py-1 font-mono border animate-pulse"
      style={{ borderColor:'#80d8ff', color:'#c0eeff', boxShadow:'0 0 10px rgba(128,216,255,0.5)', background:'rgba(100,210,255,0.07)' }}
    >
      <span style={{ fontSize:13 }}>⬡</span>
      <span className="text-xs tracking-[0.25em] font-bold">SHIELD ACTIVE</span>
    </div>
  )
}

// ── Zone badge ────────────────────────────────────────────────────────────────
function ZoneBadge() {
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]
  const ref      = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { scale:1.3, opacity:0 }, { scale:1, opacity:1, duration:0.4, ease:'back.out(2)' })
  }, [zone])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center px-3 py-1 border font-mono md:px-4 md:py-1.5"
      style={{ borderColor: zoneData.ambientColor, color: zoneData.ambientColor }}
    >
      <span className="text-[10px] tracking-[0.35em] opacity-70 font-bold">ZONE</span>
      <span className="text-xl font-black leading-none">{zone}</span>
      <span className="text-[9px] tracking-widest opacity-60 mt-0.5 font-semibold">{zoneData.name.toUpperCase()}</span>
    </div>
  )
}

// ── Score + distance ──────────────────────────────────────────────────────────
function Stats() {
  const score    = useGameStore((s) => s.score)
  const distance = useGameStore((s) => s.distance)
  const kills    = useGameStore((s) => s.kills)

  return (
    <div className="flex flex-col items-end gap-1 font-mono">
      <div className="text-right">
        <p className="text-[10px] tracking-[0.25em] text-white/50 font-bold">SCORE</p>
        <p className="text-lg md:text-xl text-[#00f5ff] leading-none tracking-wider md:tracking-widest font-black tabular-nums">
          {Math.floor(score).toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false })}
        </p>
      </div>
      <div className="flex gap-4">
        <div className="text-right">
          <p className="text-[10px] tracking-widest text-white/50 font-bold">DIST</p>
          <p className="text-sm text-white/80 font-bold">{Math.floor(distance)}m</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-widest text-white/50 font-bold">KILLS</p>
          <p className="text-sm font-bold" style={{ color:'#ff6a00' }}>{kills}</p>
        </div>
      </div>
    </div>
  )
}

// ── Crosshair ─────────────────────────────────────────────────────────────────
function Crosshair() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-6 h-6">
        <div className="absolute top-1/2 left-0 w-2 h-px bg-[#00f5ff]/60 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-2 h-px bg-[#00f5ff]/60 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 h-2 w-px bg-[#00f5ff]/60 -translate-x-1/2" />
        <div className="absolute left-1/2 bottom-0 h-2 w-px bg-[#00f5ff]/60 -translate-x-1/2" />
        <div className="absolute inset-[10px] rounded-full border border-[#00f5ff]/40" />
      </div>
    </div>
  )
}

// ── Distance progress bar (bottom) ───────────────────────────────────────────
/** Slim zone ribbon for portrait — replaces centered badge below md */
function CompactZoneRibbon() {
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  return (
    <div
      className="mb-1 w-full max-w-[min(14rem,calc(100vw-9.85rem))] px-2 py-1 border md:hidden font-mono"
      style={{ borderColor: `${zoneData.ambientColor}55`, color: zoneData.ambientColor }}
    >
      <span className="block text-[8px] tracking-[0.42em] font-bold opacity-80 leading-none select-none">
        ZONE&nbsp;{zone}
      </span>
      <span className="mt-0.5 block truncate text-[9px] font-semibold uppercase tracking-[0.12em] opacity-95 leading-snug select-none">
        {zoneData.name}
      </span>
    </div>
  )
}

function ProgressBar() {
  const distance = useGameStore((s) => s.distance)
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  const start = zone === 1 ? 0 : zone === 2 ? ZONES[1].distanceThreshold : ZONES[2].distanceThreshold
  const end   = zoneData.distanceThreshold === Infinity ? start + 2000 : zoneData.distanceThreshold
  const pct   = Math.min(100, ((distance - start) / (end - start)) * 100)

  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:pb-3 pointer-events-none max-md:pr-14">
      <div className="flex items-center gap-3">
        <span className="text-[11px] tracking-widest text-white/40 font-mono font-bold whitespace-nowrap">
          RELAY {zone}/3 UPLOAD
        </span>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width:`${pct}%`, background:zoneData.ambientColor, boxShadow:`0 0 4px ${zoneData.ambientColor}` }}
          />
        </div>
        {zone < 3 && (
          <span className="text-[11px] tracking-widest text-white/40 font-mono font-bold whitespace-nowrap">
            {Math.max(0, Math.ceil(end - distance))}m
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main HUD ──────────────────────────────────────────────────────────────────
export default function HUD() {
  const containerRef   = useRef(null)
  const tutorialActive = useGameStore((s) => s.tutorialStep >= 0)

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity:0 }, { opacity:1, duration:0.5, delay:0.3 })
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10" style={{ opacity:0 }}>
      {/* Left stack — narrower on mobile; reserve right gutter for Pause / SKIP */}
      <div
        className={[
          'absolute left-4 top-4 flex flex-col gap-2 pr-2 md:right-auto',
          'max-md:left-3 max-md:right-[9.125rem] max-md:max-w-[min(14rem,calc(100vw-9.35rem))]',
          tutorialActive
            ? 'max-md:top-[calc(env(safe-area-inset-top,0px)+2.25rem)]'
            : 'max-md:top-[max(0.5rem,env(safe-area-inset-top,0px))]',
        ].join(' ')}
      >
        <CompactZoneRibbon />
        <HealthBar />
        <EnergyBar />
        <AmmoDisplay />
        <BoostIndicator />
        <ShieldIndicator />
      </div>
      {/* Center badge — avoids collision with Tutorial label + mobile chrome */}
      <div className="absolute left-1/2 top-4 hidden -translate-x-1/2 md:block">
        <ZoneBadge />
      </div>
      {/* Stats sit below Pause + SKIP stack on narrow screens */}
      <div
        className={[
          'absolute top-4 right-4 flex flex-col items-end',
          'max-md:right-3 md:top-4',
          tutorialActive
            ? 'max-md:top-[calc(env(safe-area-inset-top,0px)+7.375rem)]'
            : 'max-md:top-[calc(env(safe-area-inset-top,0px)+6rem)]',
        ].join(' ')}
      >
        <Stats />
      </div>
      <Crosshair />
      <ProgressBar />
      {/* Corner trims — tuck on mobile where top chrome is congested */}
      <div className="absolute left-2 top-2 hidden h-4 w-4 border-l border-t border-white/15 md:block" />
      <div className="absolute right-2 top-2 hidden h-4 w-4 border-r border-t border-white/15 md:block" />
      <div className="absolute bottom-2 left-2 h-4 w-4 border-b border-l border-white/20" />
      <div className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-white/20" />
    </div>
  )
}
