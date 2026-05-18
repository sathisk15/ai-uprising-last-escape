import { useGLTF } from '@react-three/drei'

let started = false

/** Prime GLTF cache at boot — reduces time spent in Suspense on slow mobile networks. */
export function preloadGameplayModels() {
  if (typeof window === 'undefined' || started) return
  started = true
  useGLTF.preload('/models/car.glb')
  useGLTF.preload('/models/city_night.glb')
}
