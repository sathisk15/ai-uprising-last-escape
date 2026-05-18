import React, { useState, useEffect, useRef, useCallback } from 'react'
import useGameStore from '../store/gameStore'
import { tutorialSignal } from '../game/tutorialSignal'
import { obstacleSharedData } from '../components/obstacles/obstacleData'
import { droneSharedData } from '../components/enemies/droneData'

const IS_MOBILE = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

// Z threshold: freeze when an obstacle crosses this value (negative = ahead of car)
const FREEZE_Z = -18

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
  const pollRef            = useRef(null)    // setInterval for proximity polling
  const unsubRef           = useRef(null)    // Zustand unsub
  const aliveRef           = useRef(false)   // guard for async callbacks
  const lane0AwaitReturnRef = useRef(false)  // true after leaving center lane

  const clearAll = useCallback(() => {
    clearTimeout(timerRef.current)
    clearInterval(pollRef.current)
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
  }, [])

  // ── Step entry: schedule spawn + proximity-based freeze ───────────────────
  useEffect(() => {
    if (tutorialStep < 0 || tutorialStep > 2) return
    aliveRef.current = true
    setUiState('running')

    const step = tutorialStep

    // After a free-run period, spawn the obstacle (steps 1 & 2) then poll for proximity
    timerRef.current = setTimeout(() => {
      if (!aliveRef.current) return

      if (step === 0) {
        // Auto-center the car, then freeze for the lane-switch prompt
        useGameStore.getState().setPlayerLane(1)
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
        const nearSlot = slots.find((s) => s.active && s.z > FREEZE_Z)
        if (nearSlot) {
          clearInterval(pollRef.current)
          useGameStore.getState().freezeGame()
        }
      }, 80)
    }, 3000)  // 3 s free run between steps

    return () => {
      aliveRef.current = false
      clearTimeout(timerRef.current)
      clearInterval(pollRef.current)
    }
  }, [tutorialStep, clearAll])

  // ── Detect player action while frozen ─────────────────────────────────────
  useEffect(() => {
    if (!tutorialFrozen) return
    setUiState('frozen')
    const step = useGameStore.getState().tutorialStep

    if (step === 0) {
      lane0AwaitReturnRef.current = false
      setLane0PromptKey('first')
    }

    const onStepDone = () => {
      clearAll()
      if (step === 1) tutorialSignal.clearObstacles = true  // remove barricade
      useGameStore.getState().unfreezeGame()
      setUiState('stepDone')
      // Brief completion flash, then advance (or finish)
      timerRef.current = setTimeout(() => {
        if (step < 2) {
          useGameStore.getState().advanceTutorialStep()
        } else {
          // All done — trigger zone transition
          setUiState('allDone')
          timerRef.current = setTimeout(() => {
            useGameStore.getState().completeTutorial()
          }, 2000)
        }
      }, 1600)
    }

    if (step === 0) {
      unsubRef.current = useGameStore.subscribe((state, prev) => {
        if (!state.tutorialFrozen || state.tutorialStep !== 0) return
        if (state.playerLane === prev.playerLane) return

        const pl = state.playerLane

        // Phase A: waiting first move FROM center lane
        if (!lane0AwaitReturnRef.current) {
          if (prev.playerLane !== 1) return
          if (pl === 0) {
            lane0AwaitReturnRef.current = true
            setLane0PromptKey('return_right')
          } else if (pl === 2) {
            lane0AwaitReturnRef.current = true
            setLane0PromptKey('return_left')
          }
          return
        }

        // Phase B: waiting return TO center lane
        if (pl === 1 && prev.playerLane !== 1) {
          onStepDone()
        }
      })
    } else if (step === 1) {
      unsubRef.current = useGameStore.subscribe((state, prev) => {
        if (state.isJumping && !prev.isJumping) onStepDone()
      })
    } else if (step === 2) {
      const initKills = useGameStore.getState().kills
      unsubRef.current = useGameStore.subscribe((state) => {
        if (state.kills > initKills) onStepDone()
      })
    }

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
        className="absolute top-4 right-4 font-mono text-sm font-bold tracking-[0.25em]
                   px-4 py-2 border border-[#444] text-[#888]
                   hover:border-[#aaa] hover:text-white
                   transition-all duration-150 active:scale-95"
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.35em] text-[#555]">
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
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <div
            className="flex flex-col items-center gap-3 px-12 py-10 border rounded-sm"
            style={{
              background: 'rgba(0,6,0,0.95)',
              borderColor: '#00ff8855',
              boxShadow: '0 0 48px #00ff8828',
            }}
          >
            <div className="text-4xl font-bold text-[#00ff88]" style={{ animation: 'tut-pulse 0.8s ease-in-out infinite' }}>
              ✓
            </div>
            <p className="font-mono text-2xl font-bold tracking-[0.4em] text-[#00ff88]">
              TRAINING COMPLETE
            </p>
            <p className="font-mono text-sm text-[#666] tracking-[0.25em]">
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
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 px-8 py-6 border rounded-sm"
      style={{
        bottom: '7rem',
        background: 'rgba(3,3,12,0.94)',
        borderColor: stepData.color + '55',
        boxShadow: `0 0 32px ${stepData.color}25`,
        minWidth: '260px',
        maxWidth: '90vw',
        animation: 'tut-fadein 0.3s ease-out',
      }}
    >
      <div
        className="text-3xl font-bold select-none"
        style={{ color: stepData.color, animation: 'tut-pulse 1s ease-in-out infinite' }}
      >
        {icon}
      </div>
      <p className="font-mono text-lg font-bold tracking-[0.3em] text-center" style={{ color: stepData.color }}>
        {title}
      </p>
      <p className="font-mono text-sm text-[#999] tracking-wider text-center">
        {hint}
      </p>
      <div className="flex gap-2 mt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full"
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
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="flex flex-col items-center gap-3 px-10 py-8 border rounded-sm"
        style={{
          background: 'rgba(0,0,0,0.92)',
          borderColor: color + '55',
          boxShadow: `0 0 40px ${color}22`,
          animation: 'tut-fadein 0.25s ease-out',
        }}
      >
        <div className="text-4xl font-bold" style={{ color, animation: 'tut-pulse 0.7s ease-in-out infinite' }}>
          ✓
        </div>
        <p className="font-mono text-xl font-bold tracking-[0.35em] text-center" style={{ color }}>
          {label}
        </p>
      </div>
    </div>
  )
}
