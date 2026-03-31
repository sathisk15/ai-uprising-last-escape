import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../../store/gameStore'
import { ZONES } from '../../game/zones'

// Responsive bar width:  mobile=w-24 (96px)  tablet=w-36 (144px)  desktop=w-48 (192px)
const BAR_W = 'w-24 sm:w-36 lg:w-48'

// ── Health bar ────────────────────────────────────────────────────────────────
function HealthBar() {
  const health = useGameStore((s) => s.health)
  const barRef = useRef(null)
  const prevHealth = useRef(health)

  useEffect(() => {
    if (health < prevHealth.current && barRef.current) {
      gsap.fromTo(barRef.current,
        { opacity: 0.3 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      )
    }
    prevHealth.current = health
  }, [health])

  const pct   = Math.max(0, health)
  const color = pct > 50 ? '#00ff88' : pct > 25 ? '#ffaa00' : '#ff2222'

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.2em] text-white/50 font-mono">HULL</span>
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] tracking-widest font-mono" style={{ color }}>
          {Math.ceil(pct)}%
        </span>
      </div>
      <div className={`${BAR_W} h-1.5 sm:h-2 bg-white/10 rounded-sm overflow-hidden`}>
        <div
          ref={barRef}
          className="h-full rounded-sm transition-all duration-200"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
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
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.2em] text-white/50 font-mono">SIGNAL</span>
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] tracking-widest font-mono" style={{ color }}>
          {Math.ceil(pct)}%
        </span>
      </div>
      <div className={`${BAR_W} h-1.5 sm:h-2 bg-white/10 rounded-sm overflow-hidden`}>
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

  // Mobile: show just a number + small bar. Tablet+: show pips
  const MAX_PIPS = 15
  const pips     = Math.min(ammo, MAX_PIPS)

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.2em] text-white/50 font-mono">AMMO</span>
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] tracking-widest font-mono" style={{ color }}>
          {ammo}{ammo > MAX_PIPS ? '+' : ''}
        </span>
      </div>
      {/* Mobile: compact bar */}
      <div className={`${BAR_W} h-1.5 sm:hidden bg-white/10 rounded-sm overflow-hidden`}>
        <div
          className="h-full rounded-sm transition-all duration-200"
          style={{ width: `${(pips / MAX_PIPS) * 100}%`, background: color, boxShadow: `0 0 4px ${color}` }}
        />
      </div>
      {/* Tablet+: pip grid */}
      <div className={`hidden sm:flex gap-[3px] ${BAR_W} flex-wrap`}>
        {Array.from({ length: MAX_PIPS }).map((_, i) => (
          <div
            key={i}
            className="w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] rounded-sm transition-all duration-150"
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
      className="flex flex-col gap-0.5 px-2 py-1 border font-mono"
      style={{ borderColor: '#ff8800', background: 'rgba(255,100,0,0.08)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] sm:text-[9px] tracking-[0.2em]" style={{ color: '#ff8800' }}>▶▶ BOOST</span>
        <span className="text-[8px] sm:text-[9px] tracking-widest" style={{ color: '#ffcc00' }}>{speedBoostTimer.toFixed(1)}s</span>
      </div>
      <div className={`${BAR_W} h-1.5 bg-white/10 rounded-sm overflow-hidden`}>
        <div
          className="h-full rounded-sm transition-all duration-100"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#ff4400,#ffcc00)', boxShadow: '0 0 6px #ff8800' }}
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
      className="flex items-center gap-1.5 px-2 py-1 font-mono border animate-pulse"
      style={{ borderColor: '#cc44ff', color: '#cc44ff', background: 'rgba(170,0,255,0.08)' }}
    >
      <span className="text-[10px] sm:text-xs">⬡</span>
      <span className="text-[8px] sm:text-[10px] tracking-[0.2em]">SHIELD</span>
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
    gsap.fromTo(ref.current,
      { scale: 1.3, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }
    )
  }, [zone])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center px-2 sm:px-4 py-1 border font-mono"
      style={{ borderColor: zoneData.ambientColor, color: zoneData.ambientColor }}
    >
      <span className="text-[7px] sm:text-[9px] tracking-[0.35em] opacity-70">ZONE</span>
      <span className="text-base sm:text-lg font-bold leading-none">{zone}</span>
      {/* Hide long zone name on mobile */}
      <span className="hidden sm:block text-[7px] sm:text-[8px] tracking-widest opacity-60 mt-0.5">
        {zoneData.name.toUpperCase()}
      </span>
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
        <p className="text-[7px] sm:text-[9px] tracking-[0.25em] text-white/40">SCORE</p>
        <p className="text-sm sm:text-lg text-[#00f5ff] leading-none tracking-widest">
          {Math.floor(score).toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false })}
        </p>
      </div>
      <div className="flex gap-2 sm:gap-4">
        <div className="text-right">
          <p className="text-[7px] sm:text-[9px] tracking-widest text-white/40">DIST</p>
          <p className="text-[9px] sm:text-xs text-white/70">{Math.floor(distance)}m</p>
        </div>
        <div className="text-right">
          <p className="text-[7px] sm:text-[9px] tracking-widest text-white/40">KILLS</p>
          <p className="text-[9px] sm:text-xs text-[#ff6a00]">{kills}</p>
        </div>
      </div>
    </div>
  )
}

// ── Crosshair ─────────────────────────────────────────────────────────────────
function Crosshair() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-5 h-5 sm:w-6 sm:h-6">
        <div className="absolute top-1/2 left-0 w-1.5 sm:w-2 h-px bg-[#00f5ff]/60 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-1.5 sm:w-2 h-px bg-[#00f5ff]/60 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 h-1.5 sm:h-2 w-px bg-[#00f5ff]/60 -translate-x-1/2" />
        <div className="absolute left-1/2 bottom-0 h-1.5 sm:h-2 w-px bg-[#00f5ff]/60 -translate-x-1/2" />
        <div className="absolute inset-[8px] sm:inset-[10px] rounded-full border border-[#00f5ff]/40" />
      </div>
    </div>
  )
}

// ── Distance progress bar (bottom) ───────────────────────────────────────────
function ProgressBar() {
  const distance = useGameStore((s) => s.distance)
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  const start = zone === 1 ? 0 : zone === 2 ? ZONES[1].distanceThreshold : ZONES[2].distanceThreshold
  const end   = zoneData.distanceThreshold === Infinity ? start + 2000 : zoneData.distanceThreshold
  const pct   = Math.min(100, ((distance - start) / (end - start)) * 100)

  return (
    <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-6 pb-2 sm:pb-3 pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[7px] sm:text-[9px] tracking-widest text-white/30 font-mono whitespace-nowrap">
          RELAY {zone}/3
        </span>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: zoneData.ambientColor,
              boxShadow: `0 0 4px ${zoneData.ambientColor}`,
            }}
          />
        </div>
        {zone < 3 && (
          <span className="text-[7px] sm:text-[9px] tracking-widest text-white/30 font-mono whitespace-nowrap">
            {Math.max(0, Math.ceil(end - distance))}m
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main HUD ──────────────────────────────────────────────────────────────────
export default function HUD() {
  const containerRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, delay: 0.3 }
    )
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ opacity: 0 }}
    >
      {/* Top-left — health + signal + ammo + active powerups */}
      <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 flex flex-col gap-1 sm:gap-1.5 lg:gap-2">
        <HealthBar />
        <EnergyBar />
        <AmmoDisplay />
        <BoostIndicator />
        <ShieldIndicator />
      </div>

      {/* Top-center — zone badge */}
      <div className="absolute top-2 sm:top-3 lg:top-4 left-1/2 -translate-x-1/2">
        <ZoneBadge />
      </div>

      {/* Top-right — score + stats */}
      <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4">
        <Stats />
      </div>

      {/* Crosshair */}
      <Crosshair />

      {/* Bottom — zone progress */}
      <ProgressBar />

      {/* Corner brackets */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 sm:w-4 sm:h-4 border-t border-l border-white/20" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 sm:w-4 sm:h-4 border-t border-r border-white/20" />
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 sm:w-4 sm:h-4 border-b border-l border-white/20" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 sm:w-4 sm:h-4 border-b border-r border-white/20" />
    </div>
  )
}
