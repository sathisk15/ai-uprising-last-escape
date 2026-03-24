import React, { useEffect } from 'react'
import useGameStore from '../store/gameStore'
import { ZONES } from '../game/zones'

export default function ZoneTransition() {
  const zone = useGameStore((s) => s.zone)
  const resumeFromTransition = useGameStore((s) => s.resumeFromTransition)

  // Auto-dismiss after 2s (GSAP animation will be added in Feature 13)
  useEffect(() => {
    const t = setTimeout(resumeFromTransition, 2000)
    return () => clearTimeout(t)
  }, [resumeFromTransition])

  const zoneData = ZONES[zone]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <p className="text-[#ff6a00] tracking-widest text-sm mb-2">— STUB —</p>
      <p className="text-[#555] tracking-widest text-sm mb-2">ZONE {zone}</p>
      <h1 className="text-white text-3xl tracking-widest font-mono">{zoneData?.name}</h1>
    </div>
  )
}
