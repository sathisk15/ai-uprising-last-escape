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
      className="absolute z-[38] font-mono font-bold text-xs tracking-[0.2em] px-3 py-2.5 rounded-sm border
                 border-[#00f5ff]/50 text-[#00f5ff] bg-black/65 active:scale-95 shadow-[0_0_14px_rgba(0,245,255,0.2)]"
      style={{
        top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        left: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
      aria-label="Pause game"
    >
      ❚❚ PAUSE
    </button>
  )
}
