import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useGameStore from '../../store/gameStore'
import { ZONES } from '../../game/zones'

// ── Health bar ────────────────────────────────────────────────────────────────
function HealthBar() {
  const health = useGameStore((s) => s.health)
  const barRef = useRef(null)
  const prevHealth = useRef(health)

  // Flash red on damage
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.2em] text-white/50 font-mono">HULL</span>
        <span className="text-[10px] tracking-widest font-mono" style={{ color }}>
          {Math.ceil(pct)}%
        </span>
      </div>
      {/* Track */}
      <div className="w-48 h-2 bg-white/10 rounded-sm overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-sm transition-all duration-200"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      {/* Segment ticks */}
      <div className="w-48 flex justify-between px-0 -mt-1 pointer-events-none">
        {[25, 50, 75].map(tick => (
          <div key={tick} className="w-px h-1 bg-white/20" style={{ marginLeft: `${tick}%` }} />
        ))}
      </div>
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
      className="flex flex-col items-center px-4 py-1 border font-mono"
      style={{ borderColor: zoneData.ambientColor, color: zoneData.ambientColor }}
    >
      <span className="text-[9px] tracking-[0.35em] opacity-70">ZONE</span>
      <span className="text-lg font-bold leading-none">{zone}</span>
      <span className="text-[8px] tracking-widest opacity-60 mt-0.5">{zoneData.name.toUpperCase()}</span>
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
        <p className="text-[9px] tracking-[0.25em] text-white/40">SCORE</p>
        <p className="text-lg text-[#00f5ff] leading-none tracking-widest">
          {Math.floor(score).toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false })}
        </p>
      </div>
      <div className="flex gap-4">
        <div className="text-right">
          <p className="text-[9px] tracking-widest text-white/40">DIST</p>
          <p className="text-xs text-white/70">{Math.floor(distance)}m</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-widest text-white/40">KILLS</p>
          <p className="text-xs text-[#ff6a00]">{kills}</p>
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
function ProgressBar() {
  const distance = useGameStore((s) => s.distance)
  const zone     = useGameStore((s) => s.zone)
  const zoneData = ZONES[zone]

  const start = zone === 1 ? 0 : zone === 2 ? ZONES[1].distanceThreshold : ZONES[2].distanceThreshold
  const end   = zoneData.distanceThreshold === Infinity ? start + 2000 : zoneData.distanceThreshold
  const pct   = Math.min(100, ((distance - start) / (end - start)) * 100)

  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 pb-3 pointer-events-none">
      <div className="flex items-center gap-3">
        <span className="text-[9px] tracking-widest text-white/30 font-mono whitespace-nowrap">
          ZONE {zone} PROGRESS
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
          <span className="text-[9px] tracking-widest text-white/30 font-mono whitespace-nowrap">
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
      {/* Top-left — health */}
      <div className="absolute top-4 left-4">
        <HealthBar />
      </div>

      {/* Top-center — zone */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <ZoneBadge />
      </div>

      {/* Top-right — score + stats */}
      <div className="absolute top-4 right-4">
        <Stats />
      </div>

      {/* Crosshair */}
      <Crosshair />

      {/* Bottom — zone progress */}
      <ProgressBar />

      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/20" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/20" />
    </div>
  )
}
