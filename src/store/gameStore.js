import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ZONES, BASE_SPEED, DAMAGE } from '../game/zones'
import { shakeSignal, damageSignal } from '../game/shakeSignal'

// Persistent slice — survives page reload
const persistedSlice = (set) => ({
  highScore: 0,
  playerName: '',
  audioEnabled: true,
  masterVolume: 0.7,
  sfxVolume: 0.7,
  tutorialSeen: false,

  setHighScore: (score) => set({ highScore: score }),
  setPlayerName: (name) => set({ playerName: (name || '').trim().slice(0, 14).toUpperCase() }),
  setAudioEnabled: (val) => set({ audioEnabled: val }),
  setMasterVolume: (val) => set({ masterVolume: Math.max(0, Math.min(1, val)) }),
  setSfxVolume: (val) => set({ sfxVolume: Math.max(0, Math.min(1, val)) }),
})

// Session slice — reset each game
const sessionDefaults = {
  phase: 'menu',   // 'menu' | 'intro' | 'playing' | 'paused' | 'transition' | 'zoneout' | 'dying' | 'gameover' | 'victory' | 'credits'
  zone: 1,
  score: 0,
  distance: 0,
  health: 100,
  energy: 100,
  ammo: 15,        // starting ammo
  shieldActive: false,
  speedBoostActive: false,
  speedBoostTimer: 0,
  kills: 0,
  playerLane: 1,   // 0=left, 1=center, 2=right
  speed: BASE_SPEED,
  isJumping: false,
  // Tutorial session state
  tutorialStep: -1,      // -1 = not in tutorial; 0=lane, 1=jump, 2=shoot
  tutorialFrozen: false, // when true, obstacles/drones freeze in place
  tutorialSpawn: null,   // 'barricade' | 'drone' | null — one-shot spawn signal
}

const useGameStore = create(
  persist(
    (set, get) => ({
      // --- Persisted ---
      ...persistedSlice(set),

      // --- Session state ---
      ...sessionDefaults,

      // --- Actions ---
      startIntro: () => {
        set({ phase: 'intro' })
      },

      startGame: () => {
        const { tutorialSeen } = get()
        set({
          ...sessionDefaults,
          phase: 'playing',
          zone: tutorialSeen ? 1 : 0,
          tutorialStep: tutorialSeen ? -1 : 0,
        })
      },

      pauseGame: () => {
        if (get().phase === 'playing') set({ phase: 'paused' })
      },


      resumeGame: () => {
        if (get().phase === 'paused') set({ phase: 'playing' })
      },

      // ── Tutorial actions ──────────────────────────────────────────────────────
      freezeGame: () => set({ tutorialFrozen: true }),
      unfreezeGame: () => set({ tutorialFrozen: false }),
      advanceTutorialStep: () => set((s) => ({ tutorialStep: s.tutorialStep + 1 })),
      setTutorialSpawn: (val) => set({ tutorialSpawn: val }),
      completeTutorial: () => {
        set({ tutorialSeen: true, tutorialStep: -1, tutorialFrozen: false, tutorialSpawn: null })
        get().nextZone()
      },

      takeDamage: (type = 'obstacle', amount) => {
        // Shield absorbs one hit then shatters
        if (get().shieldActive) {
          set({ shieldActive: false })
          shakeSignal.pending  = true
          damageSignal.pending = true
          return
        }
        const dmg = amount ?? (DAMAGE[type]?.[1] ?? 10)
        const health = Math.max(0, get().health - dmg)
        shakeSignal.pending  = true
        damageSignal.pending = true
        if (health <= 0) {
          get().endGame()
        } else {
          set({ health })
        }
      },

      activateShield: () => {
        set({ shieldActive: true })
      },

      activateSpeedBoost: (duration = 6) => {
        set({ speedBoostActive: true, speedBoostTimer: duration })
      },

      addScore: (points) => {
        set((state) => ({ score: state.score + points }))
      },

      addKill: () => {
        const kills = get().kills + 1
        const score = get().score + 100
        set({ kills, score })
      },

      refillEnergy: (amount) => {
        set((s) => ({ energy: Math.min(100, s.energy + amount) }))
      },

      repairHealth: (amount) => {
        set((s) => ({ health: Math.min(100, s.health + amount) }))
      },

      refillAmmo: (amount) => {
        set((s) => ({ ammo: Math.min(30, s.ammo + amount) }))
      },

      useAmmo: () => {
        const { ammo } = get()
        if (ammo <= 0) return false
        set({ ammo: ammo - 1 })
        return true
      },

      setPlayerLane: (lane) => {
        set({ playerLane: Math.max(0, Math.min(2, lane)) })
      },

      startJump: () => {
        const { isJumping, phase } = get()
        if (phase !== 'playing' || isJumping) return
        set({ isJumping: true })
      },
      endJump: () => set({ isJumping: false }),

      advanceDistance: (delta) => {
        const state = get()
        if (state.phase !== 'playing') return
        if (state.tutorialFrozen) return  // world is paused for tutorial prompt

        const zone = ZONES[state.zone] ?? ZONES[1]
        const boostMult = state.speedBoostActive ? 1.6 : 1.0
        const speed = BASE_SPEED * zone.speedMultiplier * boostMult

        // Tick boost timer
        let speedBoostActive = state.speedBoostActive
        let speedBoostTimer  = state.speedBoostTimer
        if (speedBoostActive) {
          speedBoostTimer = Math.max(0, speedBoostTimer - delta)
          if (speedBoostTimer <= 0) speedBoostActive = false
        }

        const newDistance = state.distance + speed * delta
        const scoreFromDistance = Math.floor(newDistance)

        // No energy drain in zone 0 (tutorial) — drain scales with zone otherwise
        const drainRate = state.zone === 0 ? 0 : 1.2 + (state.zone - 1) * 0.35
        const newEnergy = Math.max(0, state.energy - drainRate * delta)

        set({ distance: newDistance, speed, score: scoreFromDistance + state.kills * 100, energy: newEnergy, speedBoostActive, speedBoostTimer })

        // Energy depletion = game over (skipped in zone 0)
        if (newEnergy <= 0) {
          get().endGame()
          return
        }

        // Zone 0 never auto-transitions — completeTutorial() handles that explicitly
        if (state.zone === 0) return

        // Check zone transition
        if (state.zone < 3 && newDistance >= zone.distanceThreshold) {
          get().nextZone()
        }

        // Zone 3 completion = victory
        if (state.zone === 3 && newDistance >= 5500) {
          get().triggerVictory()
        }
      },

      nextZone: () => {
        const { zone } = get()
        if (zone >= 3) return
        // Stay on current zone visuals — car drives into fog first
        set({ phase: 'zoneout' })
      },

      beginTransition: () => {
        const { phase, zone } = get()
        if (phase === 'zoneout') set({ zone: zone + 1, phase: 'transition' })
      },

      resumeFromTransition: () => {
        set({ phase: 'playing' })
      },

      endGame: () => {
        const { score, highScore, setHighScore } = get()
        if (score > highScore) setHighScore(score)
        set({ phase: 'dying' })   // plays crash animation before gameover screen
      },

      completeGameOver: () => {
        set({ phase: 'gameover' })
      },

      triggerVictory: () => {
        const { score, highScore, setHighScore } = get()
        if (score > highScore) setHighScore(score)
        set({ phase: 'victory' })
      },

      /** Post-victory scroll — from Victory «CREDITS» */
      goToCredits: () => set({ phase: 'credits' }),

      goToMenu: () => {
        set({ ...sessionDefaults, phase: 'menu' })
      },
    }),
    {
      name: 'aiuprising-v1',
      // Only persist these keys, not session state
      partialize: (state) => ({
        highScore: state.highScore,
        playerName: state.playerName,
        audioEnabled: state.audioEnabled,
        masterVolume: state.masterVolume,
        sfxVolume: state.sfxVolume,
        tutorialSeen: state.tutorialSeen,
      }),
    }
  )
)

export default useGameStore
