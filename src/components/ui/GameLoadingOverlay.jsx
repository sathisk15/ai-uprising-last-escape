import { useEffect, useState } from 'react'
import {
  GAME_LOAD_STEPS,
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

function stepIndexForStage(stageId) {
  const idx = GAME_LOAD_STEPS.findIndex((s) => s.id === stageId)
  return idx >= 0 ? idx : 0
}

/** Full-screen boot loader — staged messages until Suspense resolves. */
export default function GameLoadingOverlay() {
  const [stepIndex, setStepIndex] = useState(() => stepIndexForStage(getGameLoadStage()))

  useEffect(() => {
    return subscribeGameLoadStage((stageId) => {
      const idx = stepIndexForStage(stageId)
      setStepIndex((prev) => Math.max(prev, idx))
    })
  }, [])

  /** Slow networks: advance message if preload signal stalls on an early step */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, GAME_LOAD_STEPS.length - 1))
    }, 1600)
    return () => window.clearInterval(timer)
  }, [])

  const step = GAME_LOAD_STEPS[stepIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060d]"
      aria-busy
      aria-live="polite"
      aria-label={step.label}
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

      <div key={step.id} className="game-load-msg flex items-center gap-3 px-6">
        <LoadSpinner />
        <span className="font-mono text-sm font-semibold tracking-[0.22em] text-[#00f5ff]">
          {step.label}
        </span>
      </div>
    </div>
  )
}
