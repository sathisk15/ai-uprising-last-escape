import { useEffect, useState } from 'react'
import {
  GAME_LOAD_FINAL_LABEL,
  GAME_LOAD_FLAVOR_LINES,
  GAME_LOAD_FLAVOR_ROTATE_MS,
  getGameLoadStage,
  subscribeGameLoadStage,
} from '../../game/preloadGameplayModels'

function LoadSpinner() {
  return (
    <div
      className="game-load-spinner h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#00f5ff]/20 border-t-[#00f5ff]"
      aria-hidden
    />
  )
}

/** Full-screen boot loader: flavor messages every 30s, then locks to final-phase line. */
export default function GameLoadingOverlay() {
  const [flavorIx, setFlavorIx] = useState(0)
  const [finalPhase, setFinalPhase] = useState(() => getGameLoadStage() === 'systems')

  useEffect(() => {
    return subscribeGameLoadStage((stageId) => {
      if (stageId === 'systems') setFinalPhase(true)
    })
  }, [])

  /** Cycle themed lines until assets finish preloading — not during final attaching phase */
  useEffect(() => {
    if (finalPhase) return undefined
    const id = window.setInterval(() => {
      setFlavorIx((i) => (i + 1) % GAME_LOAD_FLAVOR_LINES.length)
    }, GAME_LOAD_FLAVOR_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [finalPhase])

  const label = finalPhase ? GAME_LOAD_FINAL_LABEL : GAME_LOAD_FLAVOR_LINES[flavorIx]
  const msgKey = finalPhase ? 'final-phase' : `flavor-${flavorIx}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060d]"
      aria-busy
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(#00f5ff22 1px, transparent 1px),
            linear-gradient(90deg, #00f5ff22 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div key={msgKey} className="game-load-msg mx-6 flex max-w-[min(94vw,28rem)] items-center gap-3">
        <LoadSpinner />
        <span className="font-mono text-sm font-semibold tracking-[0.18em] text-[#00f5ff]">
          {label}
        </span>
      </div>
    </div>
  )
}
