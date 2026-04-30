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

  setHighScore: (score) => set({ highScore: score }),
  setPlayerName: (name) => set({ playerName: (name || '').trim().slice(0, 14).toUpperCase() }),
  setAudioEnabled: (val) => set({ audioEnabled: val }),
  setMasterVolume: (val) => set({ masterVolume: Math.max(0, Math.min(1, val)) }),
  setSfxVolume: (val) => set({ sfxVolume: Math.max(0, Math.min(1, val)) }),
})

// Session slice — reset each game
const sessionDefaults = {
  phase: 'menu',   // 'menu' | 'intro' | 'playing' | 'paused' | 'transition' | 'zoneout' | 'dying' | 'gameover' | 'victory'
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
        set({
          ...sessionDefaults,
          phase: 'playing',
        })
      },

      pauseGame: () => {
        if (get().phase === 'playing') set({ phase: 'paused' })
      },


      resumeGame: () => {
        if (get().phase === 'paused') set({ phase: 'playing' })
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

        const zone = ZONES[state.zone]
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

        // Energy drains at 1.2 pts/s in zone 1, slightly faster in higher zones
        const drainRate = 1.2 + (state.zone - 1) * 0.35
        const newEnergy = Math.max(0, state.energy - drainRate * delta)

        set({ distance: newDistance, speed, score: scoreFromDistance + state.kills * 100, energy: newEnergy, speedBoostActive, speedBoostTimer })

        // Energy depletion = game over
        if (newEnergy <= 0) {
          get().endGame()
          return
        }

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
      }),
    }
  )
)

export default useGameStore
