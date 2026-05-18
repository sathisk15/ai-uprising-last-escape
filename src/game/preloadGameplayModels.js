import { useGLTF } from '@react-three/drei'

/** @typedef {'loading' | 'vehicle' | 'city' | 'systems'} GameLoadStage */

let started = false
/** @type {GameLoadStage} */
let stage = 'loading'
/** @type {Set<(s: GameLoadStage) => void>} */
const listeners = new Set()
/** @type {Promise<void> | null} */
let preloadPromise = null

export const GAME_LOAD_STEPS = [
  { id: 'loading', label: 'Loading...' },
  { id: 'vehicle', label: 'Preparing vehicle...' },
  { id: 'city', label: 'Building cityscape...' },
  { id: 'systems', label: 'Initializing systems...' },
]

/** @returns {GameLoadStage} */
export function getGameLoadStage() {
  return stage
}

/** @param {(s: GameLoadStage) => void} fn */
export function subscribeGameLoadStage(fn) {
  listeners.add(fn)
  fn(stage)
  return () => listeners.delete(fn)
}

/** @param {GameLoadStage} next */
function setStage(next) {
  stage = next
  listeners.forEach((fn) => fn(next))
}

/** Prime GLTF cache at boot — drives loader step labels on real devices. */
export function preloadGameplayModels() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (preloadPromise) return preloadPromise

  started = true
  preloadPromise = (async () => {
    setStage('loading')
    setStage('vehicle')
    await useGLTF.preload('/models/car.glb')
    setStage('city')
    await useGLTF.preload('/models/city_night.glb')
    setStage('systems')
  })()

  return preloadPromise
}
