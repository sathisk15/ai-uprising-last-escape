import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ZONES, BASE_SPEED, DAMAGE } from '../game/zones'
import { shakeSignal } from '../game/shakeSignal'

// Persistent slice — survives page reload
const persistedSlice = (set) => ({
  highScore: 0,
  audioEnabled: true,
  masterVolume: 0.7,

  setHighScore: (score) => set({ highScore: score }),
  setAudioEnabled: (val) => set({ audioEnabled: val }),
  setMasterVolume: (val) => set({ masterVolume: val }),
})

// Session slice — reset each game
const sessionDefaults = {
  phase: 'menu',   // 'menu' | 'playing' | 'paused' | 'transition' | 'gameover' | 'victory'
  zone: 1,
  score: 0,
  distance: 0,
  health: 100,
  energy: 100,
  ammo: 15,        // starting ammo
  kills: 0,
  playerLane: 1,   // 0=left, 1=center, 2=right
  speed: BASE_SPEED,
  isJumping: false,
  isSliding: false,
}

const useGameStore = create(
  persist(
    (set, get) => ({
      // --- Persisted ---
      ...persistedSlice(set),

      // --- Session state ---
      ...sessionDefaults,

      // --- Actions ---
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

      takeDamage: (type = 'obstacle') => {
        const amount = DAMAGE[type] ?? DAMAGE.obstacle
        const health = Math.max(0, get().health - amount)
        shakeSignal.pending = true
        if (health <= 0) {
          get().endGame()
        } else {
          set({ health })
        }
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
        const { isJumping, isSliding, phase } = get()
        if (phase !== 'playing' || isJumping || isSliding) return
        set({ isJumping: true })
      },
      endJump: () => set({ isJumping: false }),

      startSlide: () => {
        const { isJumping, isSliding, phase } = get()
        if (phase !== 'playing' || isJumping || isSliding) return
        set({ isSliding: true })
      },
      endSlide: () => set({ isSliding: false }),

      advanceDistance: (delta) => {
        const state = get()
        if (state.phase !== 'playing') return

        const zone = ZONES[state.zone]
        const speed = BASE_SPEED * zone.speedMultiplier
        const newDistance = state.distance + speed * delta
        const scoreFromDistance = Math.floor(newDistance)

        // Energy drains at 2 pts/s in zone 1, slightly faster in higher zones
        const drainRate = 2.0 + (state.zone - 1) * 0.6
        const newEnergy = Math.max(0, state.energy - drainRate * delta)

        set({ distance: newDistance, speed, score: scoreFromDistance + state.kills * 100, energy: newEnergy })

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
        set({ zone: zone + 1, phase: 'transition' })
      },

      resumeFromTransition: () => {
        set({ phase: 'playing' })
      },

      endGame: () => {
        const { score, highScore, setHighScore } = get()
        if (score > highScore) setHighScore(score)
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
        audioEnabled: state.audioEnabled,
        masterVolume: state.masterVolume,
      }),
    }
  )
)

export default useGameStore
