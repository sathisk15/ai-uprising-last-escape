import React, { useState, useEffect, useRef, useCallback } from 'react'
import useGameStore from '../store/gameStore'
import { tutorialSignal } from '../game/tutorialSignal'
import { obstacleSharedData } from '../components/obstacles/obstacleData'
import { droneSharedData } from '../components/enemies/droneData'

const IS_MOBILE = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

/**
 * Barricade Z increases toward player (spawn ~−68 → car ~2). Freeze for jump prompt only
 * when the barrier is close — old −18 paused ~20 units too early (~1 s drive at base speed).
 */
const BARRICADE_FREEZE_MIN_Z = -2

/** Drone cue keeps the original farther threshold so aiming has more lead time */
const DRONE_TUTORIAL_FREEZE_MIN_Z = -16

/** After first lateral swipe during lane training — short drive before prompting return to center. */
const LANE_RUN_AFTER_FIRST_SWIPE_MS = 2600

// Step 0: leave center first, then only the opposite swipe returns — car ends centered
const LANE_PROMPTS = {
  first: {
    title: 'SWITCH LANES — STEP 1',
    icon: '◀   ▶',
    mobileHint: 'Swipe LEFT or RIGHT',
    desktopHint: '←  or  →  •  A  or  D',
  },
  return_right: {
    title: 'BACK TO CENTER',
    icon: '▶',
    mobileHint: 'Swipe RIGHT',
    desktopHint: '→  or  D',
  },
  return_left: {
    title: 'BACK TO CENTER',
    icon: '◀',
    mobileHint: 'Swipe LEFT',
    desktopHint: '←  or  A',
  },
}

const STEPS = [
  {
    title: 'SWITCH LANES',
    icon: '◀  ▶',
    mobileHint: 'Swipe left or right',
    desktopHint: '← → keys  or  A / D',
    color: '#00f5ff',
    completionLabel: 'LANE SWITCH — COMPLETE',
  },
  {
    title: 'JUMP OVER BARRIER',
    icon: '▲',
    mobileHint: 'Swipe up',
    desktopHint: 'Space  or  ↑',
    color: '#ffaa00',
    completionLabel: 'BARRIER CLEARED — COMPLETE',
  },
  {
    title: 'SHOOT THE DRONE',
    icon: '◉',
    mobileHint: 'Tap the screen',
    desktopHint: 'Z  or  F',
    color: '#ff4444',
    completionLabel: 'DRONE DESTROYED — COMPLETE',
  },
]

export default function TutorialOverlay() {
  const tutorialStep   = useGameStore((s) => s.tutorialStep)
  const tutorialFrozen = useGameStore((s) => s.tutorialFrozen)
  const phase          = useGameStore((s) => s.phase)

  // 'idle' → 'running' → 'frozen' → 'stepDone' → (next step or 'allDone')
  const [uiState, setUiState] = useState('idle')  // for rendering
  /** 'first' | 'return_right' | 'return_left' — lane tutorial dual-step */
  const [lane0PromptKey, setLane0PromptKey] = useState('first')

  const timerRef           = useRef(null)
  const laneRunTimerRef    = useRef(null)    // free-run between lane swipes (step 0)
  const jumpCompleteTimerRef = useRef(null)  // defer jump step completion until bar clears
  const pollRef            = useRef(null)    // setInterval for proximity polling
  const unsubRef           = useRef(null)    // Zustand unsub
  const aliveRef           = useRef(false)   // guard for async callbacks
  /** 'boot' → 'firstFreeze' → 'runningGap' → 'returnFreeze' → done */
  const lane0PhaseRef       = useRef('boot')
  const lanePollPrevLaneRef = useRef(1)
  /** Prevents duplicate jump-complete handler */
  const barrierJumpHandledRef = useRef(false)

  const clearTimersOnly = useCallback(() => {
    clearTimeout(timerRef.current)
    clearTimeout(laneRunTimerRef.current)
    clearTimeout(jumpCompleteTimerRef.current)
    laneRunTimerRef.current = null
    jumpCompleteTimerRef.current = null
    clearInterval(pollRef.current)
  }, [])

  const clearAll = useCallback(() => {
    clearTimersOnly()
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
  }, [clearTimersOnly])

  // ── Step entry: schedule spawn + proximity-based freeze ───────────────────
  useEffect(() => {
    if (tutorialStep < 0 || tutorialStep > 2) return
    aliveRef.current = true
    setUiState('running')

    const step = tutorialStep

    if (step === 0) {
      lane0PhaseRef.current = 'boot'
      setLane0PromptKey('first')
      lanePollPrevLaneRef.current = 1
    }
    barrierJumpHandledRef.current = false

    // After a free-run period, spawn the obstacle (steps 1 & 2) then poll for proximity
    timerRef.current = setTimeout(() => {
      if (!aliveRef.current) return

      if (step === 0) {
        useGameStore.getState().setPlayerLane(1)
        lane0PhaseRef.current = 'firstFreeze'
        lanePollPrevLaneRef.current = 1
        useGameStore.getState().freezeGame()
        return
      }

      // Auto-center car, then spawn in center lane so obstacle always lines up
      useGameStore.getState().setPlayerLane(1)
      useGameStore.getState().setTutorialSpawn(step === 1 ? 'barricade' : 'drone')

      pollRef.current = setInterval(() => {
        if (!aliveRef.current) { clearInterval(pollRef.current); return }

        const slots = step === 1
          ? obstacleSharedData.barricadeSlots
          : droneSharedData.slots

        if (!slots) return
        const freezeNearZ = step === 1 ? BARRICADE_FREEZE_MIN_Z : DRONE_TUTORIAL_FREEZE_MIN_Z
        const nearSlot = slots.find((s) => s.active && s.z > freezeNearZ)
        if (nearSlot) {
          clearInterval(pollRef.current)
          useGameStore.getState().freezeGame()
        }
      }, 80)
    }, 3000)  // 3 s free run between steps

    return () => {
      aliveRef.current = false
      clearTimersOnly()
      timerRef.current = null
    }
  }, [tutorialStep, clearTimersOnly])

  // ── Lane step 0: first swipe → brief drive → freeze → return center ─────────
  useEffect(() => {
    if (tutorialStep !== 0) return undefined

    const tick = window.setInterval(() => {
      const gs = useGameStore.getState()
      if (gs.phase !== 'playing' || gs.tutorialStep !== 0 || !aliveRef.current) return

      const phaseLane = lane0PhaseRef.current
      const pl = gs.playerLane
      const frozen = gs.tutorialFrozen

      // First swipe from center → unfreeze so the world rolls a few seconds
      if (
        phaseLane === 'firstFreeze'
        && frozen
        && pl !== 1
        && lanePollPrevLaneRef.current === 1
      ) {
        if (pl === 0) setLane0PromptKey('return_right')
        else if (pl === 2) setLane0PromptKey('return_left')
        lane0PhaseRef.current = 'runningGap'
        lanePollPrevLaneRef.current = pl
        clearTimeout(laneRunTimerRef.current)
        gs.unfreezeGame()
        setUiState('running')
        laneRunTimerRef.current = window.setTimeout(() => {
          if (useGameStore.getState().tutorialStep !== 0) return
          lane0PhaseRef.current = 'returnFreeze'
          lanePollPrevLaneRef.current = useGameStore.getState().playerLane
          useGameStore.getState().freezeGame()
        }, LANE_RUN_AFTER_FIRST_SWIPE_MS)
        return
      }

      // After return-freeze prompt: swipe back to center completes step
      if (
        phaseLane === 'returnFreeze'
        && frozen
        && pl === 1
        && lanePollPrevLaneRef.current !== 1
      ) {
        clearTimeout(laneRunTimerRef.current)
        laneRunTimerRef.current = null
        lane0PhaseRef.current = 'boot'
        clearAll()
        useGameStore.getState().unfreezeGame()
        setUiState('stepDone')
        timerRef.current = window.setTimeout(() => {
          useGameStore.getState().advanceTutorialStep()
        }, 1600)
        return
      }

      lanePollPrevLaneRef.current = pl
    }, 42)

    return () => window.clearInterval(tick)
  }, [tutorialStep, clearAll])

  // ── Jump barrier (step 1): detect jump during freeze → unfreeze so car clears ─
  useEffect(() => {
    if (tutorialStep !== 1) {
      barrierJumpHandledRef.current = false
      return undefined
    }
    barrierJumpHandledRef.current = false
    /** @type {{ isJumping: boolean }} */
    const prevSnap = { isJumping: useGameStore.getState().isJumping }

    const unsub = useGameStore.subscribe((state) => {
      if (state.phase !== 'playing' || state.tutorialStep !== 1) return
      if (barrierJumpHandledRef.current) return

      const jumpStarted = Boolean(state.isJumping && !prevSnap.isJumping)
      prevSnap.isJumping = state.isJumping
      if (!jumpStarted) return
      if (!state.tutorialFrozen) return

      barrierJumpHandledRef.current = true
      clearTimeout(jumpCompleteTimerRef.current)
      useGameStore.getState().unfreezeGame()
      setUiState('running')

      jumpCompleteTimerRef.current = window.setTimeout(() => {
        barrierJumpHandledRef.current = false
        tutorialSignal.clearObstacles = true
        clearAll()
        useGameStore.getState().unfreezeGame()
        setUiState('stepDone')
        timerRef.current = window.setTimeout(() => {
          useGameStore.getState().advanceTutorialStep()
        }, 1600)
      }, 1050)
    })

    return () => {
      unsub()
      prevSnap.isJumping = false
      clearTimeout(jumpCompleteTimerRef.current)
      jumpCompleteTimerRef.current = null
    }
  }, [tutorialStep, clearAll])

  // ── Detect drone kill while frozen (step 2) ─────────────────────────────────
  useEffect(() => {
    if (!tutorialFrozen) return undefined
    setUiState('frozen')
    const step = useGameStore.getState().tutorialStep

    const onShootStepDone = () => {
      clearAll()
      useGameStore.getState().unfreezeGame()
      setUiState('stepDone')
      timerRef.current = window.setTimeout(() => {
        setUiState('allDone')
        timerRef.current = window.setTimeout(() => {
          useGameStore.getState().completeTutorial()
        }, 2000)
      }, 1600)
    }

    if (step !== 2) return undefined

    const initKills = useGameStore.getState().kills
    unsubRef.current = useGameStore.subscribe((state) => {
      if (!state.tutorialFrozen || state.tutorialStep !== 2) return
      if (state.kills > initKills) onShootStepDone()
    })

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    }
  }, [tutorialFrozen, clearAll])

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase !== 'playing' || tutorialStep < 0) return null

  const stepData = STEPS[Math.min(tutorialStep, 2)]

  return (
    <div className="absolute inset-0 pointer-events-none z-30">

      {/* SKIP */}
      <button
        type="button"
        data-game-ui-touch
        className="absolute right-[max(0.35rem,env(safe-area-inset-right))]
                   top-[calc(env(safe-area-inset-top,0px)+3.05rem)]
                   z-[32] px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.2em] border border-[#444] text-[#888]
                   transition-all duration-150 active:scale-95
                   hover:border-[#aaa] hover:text-white
                   md:top-[max(0.85rem,env(safe-area-inset-top))]
                   md:px-4 md:py-2 md:text-sm md:tracking-[0.25em]"
        style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.7)', touchAction: 'manipulation' }}
        onClick={() => {
          aliveRef.current = false
          clearAll()
          tutorialSignal.clearObstacles = true
          useGameStore.getState().unfreezeGame()
          useGameStore.getState().completeTutorial()
        }}
      >
        SKIP
      </button>

      {/* Step counter */}
      {(uiState === 'running' || uiState === 'frozen') && (
        <div
          className="absolute left-[max(0.6rem,env(safe-area-inset-left))]
                     top-[max(0.45rem,env(safe-area-inset-top))]
                     z-[31] max-w-[min(calc(100vw-9.25rem),12.5rem)] truncate rounded-sm border border-[#444]/40 bg-black/50 px-2 py-0.5 font-mono text-[9px] tracking-[0.42em] text-[#9a9a9a]
                     backdrop-blur-sm
                     md:top-[max(0.95rem,env(safe-area-inset-top))] md:left-1/2 md:-translate-x-1/2 md:max-w-fit md:bg-transparent md:px-0 md:py-0 md:text-xs md:tracking-[0.35em] md:border-none md:text-[#555] md:backdrop-blur-none md:text-center md:overflow-visible md:whitespace-normal md:rounded-none"
        >
          TRAINING &nbsp;{tutorialStep + 1} / 3
        </div>
      )}

      {/* Frozen action prompt */}
      {uiState === 'frozen' && (
        <PromptCard
          stepData={stepData}
          lanePrompt={tutorialStep === 0 ? LANE_PROMPTS[lane0PromptKey] : null}
        />
      )}

      {/* Step-complete flash (same card for every step) */}
      {uiState === 'stepDone' && (
        <CompletionCard
          label={stepData.completionLabel}
          color={stepData.color}
        />
      )}

      {/* All training done */}
      {uiState === 'allDone' && (
        <div
          className="absolute inset-0 flex md:items-center md:justify-center items-end justify-center pb-0 md:bg-[rgba(0,0,0,0.55)] bg-transparent"
        >
          <div
            className="flex w-[calc(100%-1rem)] max-w-[17rem] flex-col items-center gap-1 px-4 py-2.5 mx-4 mb-[max(calc(env(safe-area-inset-bottom,0px)+3.75rem),0.65rem)] border rounded-md
                       md:w-auto md:max-w-none md:gap-3 md:px-12 md:py-10 md:mx-0 md:mb-0 md:rounded-sm"
            style={{
              background: 'rgba(0,6,0,0.96)',
              borderColor: '#00ff8855',
              boxShadow: '0 0 48px #00ff8828',
              animation: 'tut-fadein 0.3s ease-out',
            }}
          >
            <div
              className="text-xl font-bold text-[#00ff88] md:text-4xl"
              style={{ animation: 'tut-pulse 0.8s ease-in-out infinite' }}
            >
              ✓
            </div>
            <p className="font-mono text-[11px] font-bold leading-snug tracking-[0.2em] text-[#00ff88] text-center md:text-2xl md:tracking-[0.4em]">
              TRAINING COMPLETE
            </p>
            <p className="font-mono text-[9px] text-[#666] tracking-[0.2em] md:text-sm md:tracking-[0.25em]">
              DEPLOYING TO MISSION…
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tut-pulse {
          0%, 100% { transform: scale(1);    opacity: 1;    }
          50%       { transform: scale(1.12); opacity: 0.82; }
        }
        @keyframes tut-blink {
          from { opacity: 0.25; }
          to   { opacity: 1;    }
        }
        @keyframes tut-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PromptCard({ stepData, lanePrompt }) {
  const title = lanePrompt?.title ?? stepData.title
  const icon  = lanePrompt?.icon ?? stepData.icon
  const hint  = lanePrompt
    ? (IS_MOBILE ? lanePrompt.mobileHint : lanePrompt.desktopHint)
    : (IS_MOBILE ? stepData.mobileHint : stepData.desktopHint)
  /** Mobile: compact ribbon above HUD progress; desktop: taller card above HUD */
  const bottomOffset = IS_MOBILE
    ? 'max(calc(env(safe-area-inset-bottom, 0px) + 3.65rem), 0.6rem)'
    : 'max(7rem, calc(env(safe-area-inset-bottom, 0px) + 5.25rem))'
  return (
    <div
      className="pointer-events-none absolute left-1/2 flex min-w-0 max-w-[min(92vw,22rem)] -translate-x-1/2 flex-col items-center
                 gap-1 border px-3 py-2 shadow-lg
                 w-[calc(100%-1rem)] rounded-md md:w-auto md:max-w-[min(92vw,21rem)] md:gap-3 md:rounded-sm md:px-8 md:py-6"
      style={{
        bottom: bottomOffset,
        background: 'rgba(3,3,12,0.94)',
        borderColor: stepData.color + '55',
        boxShadow: `0 0 32px ${stepData.color}25`,
        minWidth: IS_MOBILE ? undefined : 'min(260px, 92vw)',
        animation: 'tut-fadein 0.3s ease-out',
      }}
    >
      {/* Mobile: tight row • Desktop: stacked */}
      <div className="flex w-full min-w-0 flex-row items-center justify-center gap-2 md:flex-col md:gap-3">
        <div
          className="select-none shrink-0 text-lg font-bold leading-none md:text-2xl lg:text-3xl"
          style={{ color: stepData.color, animation: 'tut-pulse 1s ease-in-out infinite' }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-center md:w-full md:flex-none">
          <p
            className="font-mono text-[10px] font-bold leading-tight tracking-[0.12em] text-center md:text-base md:tracking-[0.3em] lg:text-lg"
            style={{ color: stepData.color }}
          >
            {title}
          </p>
        </div>
      </div>
      <p className="font-mono text-[9px] leading-snug tracking-wide text-[#aaa] text-center px-0.5 md:text-sm md:text-[#999]">
        {hint}
      </p>
      <div className="flex gap-1 mt-0.5 md:gap-2 md:mt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 w-1 rounded-full md:h-1.5 md:w-1.5"
            style={{
              backgroundColor: stepData.color,
              animation: `tut-blink 0.6s ease-in-out ${i * 0.2}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CompletionCard({ label, color }) {
  return (
    <div
      className="absolute inset-0 flex md:items-center md:justify-center items-end justify-center md:bg-[rgba(0,0,0,0.45)] bg-transparent"
    >
      <div
        className="flex w-[calc(100%-1rem)] max-w-[16.5rem] flex-col items-center gap-1.5 border px-3 py-2.5 mx-4 rounded-md mb-[max(calc(env(safe-area-inset-bottom,0px)+3.65rem),0.6rem)]
                   md:w-auto md:max-w-none md:gap-3 md:px-10 md:py-8 md:mx-0 md:mb-0 md:rounded-sm"
        style={{
          background: 'rgba(0,0,0,0.92)',
          borderColor: color + '55',
          boxShadow: `0 0 40px ${color}22`,
          animation: 'tut-fadein 0.25s ease-out',
        }}
      >
        <div
          className="text-xl font-bold md:text-4xl"
          style={{ color, animation: 'tut-pulse 0.7s ease-in-out infinite' }}
        >
          ✓
        </div>
        <p
          className="font-mono text-[10px] font-bold leading-tight tracking-[0.12em] text-center md:text-xl md:tracking-[0.35em]"
          style={{ color }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
