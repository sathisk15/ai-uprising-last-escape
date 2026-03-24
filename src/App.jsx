import React, { useEffect } from 'react'
import useGameStore from './store/gameStore'
import MainMenu from './screens/MainMenu'
import GameScreen from './screens/GameScreen'
import GameOver from './screens/GameOver'
import Victory from './screens/Victory'
import ZoneTransition from './screens/ZoneTransition'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const resumeGame = useGameStore((s) => s.resumeGame)

  // Global keyboard: P / Escape to pause-resume
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (phase === 'playing') pauseGame()
        else if (phase === 'paused') resumeGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pauseGame, resumeGame])

  return (
    <div className="w-full h-full">
      {/* Zone transition overlays the game */}
      {phase === 'transition' && <ZoneTransition />}

      {/* Main phase routing */}
      {phase === 'menu' && <MainMenu />}
      {(phase === 'playing' || phase === 'paused') && <GameScreen />}
      {phase === 'gameover' && <GameOver />}
      {phase === 'victory' && <Victory />}
    </div>
  )
}
