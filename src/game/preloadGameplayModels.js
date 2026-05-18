import { useGLTF } from '@react-three/drei'

/** @typedef {'loading' | 'vehicle' | 'city' | 'systems'} GameLoadStage */

let stage = /** @type {GameLoadStage} */ ('loading')
/** @type {Set<(s: GameLoadStage) => void>} */
const listeners = new Set()
/** @type {Promise<void> | null} */
let preloadPromise = null

/** Shown continuously after GLBs decode — until WebGL/React finish mounting (often feels like ~99%). */
export const GAME_LOAD_FINAL_LABEL = 'Initializing systems…'

/** Themed lines rotated while assets/network are still fetching (every {@link GAME_LOAD_FLAVOR_ROTATE_MS}). */
export const GAME_LOAD_FLAVOR_LINES = [
  'Preparing systems for deployment…',
  'Calibrating vehicle chassis…',
  'Finalizing egress route…',
  'Syncing skyline telemetry…',
  'Indexing sector geometry…',
  'Priming combat subsystems…',
]

/** Rotate flavor text interval (milliseconds). */
export const GAME_LOAD_FLAVOR_ROTATE_MS = 30000

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

/** Prime GLTF cache at boot — signals when final-phase message should lock on. */
export function preloadGameplayModels() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (preloadPromise) return preloadPromise

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
