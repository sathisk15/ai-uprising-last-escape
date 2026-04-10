import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../store/gameStore'

const ZONEOUT_DURATION = 1.5   // seconds car drives into fog before banner appears

export default function GameLoop() {
  const zoneoutT = useRef(0)

  useFrame((_, delta) => {
    const { phase, advanceDistance, beginTransition } = useGameStore.getState()
    const safeDelta = Math.min(delta, 0.1)

    if (phase === 'playing') {
      zoneoutT.current = 0
      advanceDistance(safeDelta)
      return
    }

    if (phase === 'zoneout') {
      zoneoutT.current += safeDelta
      if (zoneoutT.current >= ZONEOUT_DURATION) {
        zoneoutT.current = 0
        beginTransition()
      }
    }
  })

  return null
}
