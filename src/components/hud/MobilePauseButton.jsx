import useGameStore from '../../store/gameStore'

/** Coarse-pointer / touch: show Pause so mobile players aren't stuck without P/Esc */
function showMobilePauseChrome() {
  if (typeof window === 'undefined') return false
  if (navigator.maxTouchPoints > 0) return true
  try {
    return window.matchMedia('(pointer: coarse)').matches
  } catch {
    return false
  }
}

export default function MobilePauseButton() {
  const phase = useGameStore((s) => s.phase)
  const pauseGame = useGameStore((s) => s.pauseGame)

  if (!showMobilePauseChrome() || phase !== 'playing') return null

  return (
    <button
      type="button"
      data-game-ui-touch
      onClick={() => pauseGame()}
      className="absolute left-auto z-[38] rounded-sm border border-[#00f5ff]/50 bg-black/65 px-2 py-2
                 font-mono text-[10px] font-bold leading-tight tracking-[0.14em]
                 text-[#00f5ff] shadow-[0_0_14px_rgba(0,245,255,0.2)] backdrop-blur-sm
                 active:scale-95
                 max-md:top-[max(0.5rem,env(safe-area-inset-top))]
                 max-md:right-[max(0.45rem,env(safe-area-inset-right))]
                 md:left-[max(0.75rem,env(safe-area-inset-left))]
                 md:right-auto md:top-[max(0.75rem,env(safe-area-inset-top))]
                 md:px-3 md:py-2.5 md:text-xs md:tracking-[0.2em]"
      style={{
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
      aria-label="Pause game"
    >
      ❚❚ PAUSE
    </button>
  )
}
