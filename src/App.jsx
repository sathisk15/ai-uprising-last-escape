import { useEffect } from 'react'
import useGameStore from './store/gameStore'
import MainMenu from './screens/MainMenu'
import IntroDialogue from './screens/IntroDialogue'
import GameScreen from './screens/GameScreen'
import GameOver from './screens/GameOver'
import Victory from './screens/Victory'
import ZoneTransition from './screens/ZoneTransition'
import AudioManager from './audio/AudioManager'

function requestFullscreen() {
  const el = document.documentElement
  if (el.requestFullscreen) el.requestFullscreen()
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen()
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement)
}

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const zone  = useGameStore((s) => s.zone)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const resumeGame = useGameStore((s) => s.resumeGame)

  // Fullscreen: enter on intro/game start, exit when back at menu
  useEffect(() => {
    if (phase === 'intro') {
      requestFullscreen()
    } else if (phase === 'menu') {
      if (isFullscreen()) exitFullscreen()
    }
  }, [phase])

  // BGM — start/stop based on phase + zone
  useEffect(() => {
    if (phase === 'playing' || phase === 'paused' || phase === 'transition' || phase === 'zoneout') {
      AudioManager.playBGM(zone)
    } else if (phase === 'gameover') {
      AudioManager.stopBGM()
      AudioManager.playSFX('game_over')
    } else if (phase === 'victory') {
      AudioManager.stopBGM()
      AudioManager.playSFX('victory')
    } else {
      AudioManager.stopBGM()
    }
  }, [phase, zone])

  // Global keyboard: P to pause-resume | Escape to pause (not fullscreen exit) | F to toggle fullscreen
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyF') {
        isFullscreen() ? exitFullscreen() : requestFullscreen()
        return
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (phase === 'playing') pauseGame()
        else if (phase === 'paused') resumeGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pauseGame, resumeGame])

  return (
    <div className="w-full h-full relative">
      {/* Game stays mounted during zoneout/transition/dying so the 3D world keeps rendering */}
      {(phase === 'playing' || phase === 'paused' || phase === 'transition' || phase === 'dying' || phase === 'zoneout') && <GameScreen />}

      {/* Zone transition overlays the live game */}
      {phase === 'transition' && <ZoneTransition />}

      {/* Other phases */}
      {phase === 'menu'     && <MainMenu />}
      {phase === 'intro'    && <IntroDialogue />}
      {phase === 'gameover' && <GameOver />}
      {phase === 'victory'  && <Victory />}
    </div>
  )
}
