import { useEffect, useRef } from 'react'
import useGameStore from './store/gameStore'
import MainMenu from './screens/MainMenu'
import IntroDialogue from './screens/IntroDialogue'
import GameScreen from './screens/GameScreen'
import GameOver from './screens/GameOver'
import Victory from './screens/Victory'
import EndCredits from './screens/EndCredits'
import ZoneTransition from './screens/ZoneTransition'
import AudioManager from './audio/AudioManager'
import { preloadGameplayModels } from './game/preloadGameplayModels'
import { isMobileLikeDevice } from './game/graphicsQuality'

/** Real phones: programmatic fullscreen + % heights → 0×0 WebGL canvas on Safari/Android */
function prefersSkipBrowserFullscreen() {
  if (typeof navigator === 'undefined') return false
  if (isMobileLikeDevice()) return true
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return false
}

function CustomCursor() {
  /** Reticle only for mouse / desktop — touch phones show their own taps; UI shows crosshair clash (see screenshot). */
  const enabled = typeof window !== 'undefined' && !isMobileLikeDevice()

  const dotRef   = useRef(null)
  const ringRef  = useRef(null)

  /** @param {number} cx @param {number} cy */
  const applyPos = (cx, cy) => {
    if (dotRef.current)  dotRef.current.style.transform  = `translate(${cx}px, ${cy}px)`
    if (ringRef.current) ringRef.current.style.transform = `translate(${cx}px, ${cy}px)`
  }

  useEffect(() => {
    if (!enabled) return undefined

    /** @param {PointerEvent} e */
    const onPointer = (e) => {
      applyPos(e.clientX, e.clientY)
    }

    window.addEventListener('pointermove', onPointer)
    window.addEventListener('pointerdown', onPointer)

    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [enabled])

  if (!enabled) return null

  const C = '#00f5ff'   // cyan — matches game UI
  const b = `1.5px solid ${C}`

  return (
    <>
      {/* Outer corner-bracket reticle */}
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999,
        width: 28, height: 28, marginLeft: -14, marginTop: -14,
        animation: 'reticle-pulse 2s ease-in-out infinite',
      }}>
        {/* TL */}
        <div style={{ position:'absolute', top:0,    left:0,  width:7, height:7, borderTop:b, borderLeft:b }} />
        {/* TR */}
        <div style={{ position:'absolute', top:0,    right:0, width:7, height:7, borderTop:b, borderRight:b }} />
        {/* BL */}
        <div style={{ position:'absolute', bottom:0, left:0,  width:7, height:7, borderBottom:b, borderLeft:b }} />
        {/* BR */}
        <div style={{ position:'absolute', bottom:0, right:0, width:7, height:7, borderBottom:b, borderRight:b }} />
        {/* Centre dot */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          width:3, height:3, marginLeft:-1.5, marginTop:-1.5,
          background: C, borderRadius:'50%',
          boxShadow: `0 0 4px ${C}`,
        }} />
      </div>

      {/* Inner dot that follows exactly */}
      <div ref={dotRef} style={{
        position:'fixed', top:0, left:0, pointerEvents:'none', zIndex:99999,
        width:2, height:2, marginLeft:-1, marginTop:-1,
        background: C, borderRadius:'50%',
      }} />
    </>
  )
}

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

  useEffect(() => {
    preloadGameplayModels()
  }, [])

  // Fullscreen: enter on intro/game start, exit when back at menu
  useEffect(() => {
    if (phase === 'intro') {
      if (!prefersSkipBrowserFullscreen()) requestFullscreen()
    } else if (phase === 'menu') {
      if (isFullscreen()) exitFullscreen()
    }
  }, [phase])

  // BGM — phase-aware routing
  // menu/intro  → light ambient (zone 0): no drums, soft pads
  // playing/zoneout/transition → full zone music with arp echo
  // paused      → duck volume to 20%, keep music playing
  // gameover/victory → stop + SFX
  useEffect(() => {
    if (phase === 'playing' || phase === 'zoneout' || phase === 'transition') {
      AudioManager.unduckBGM()
      AudioManager.playBGM(zone)
    } else if (phase === 'paused') {
      AudioManager.duckBGM()
    } else if (phase === 'menu' || phase === 'intro' || phase === 'credits') {
      AudioManager.playBGM(0)
    } else if (phase === 'gameover') {
      AudioManager.stopBGM()
      AudioManager.playSFX('game_over')
    } else if (phase === 'victory') {
      AudioManager.stopBGM()
      AudioManager.playSFX('victory')
    }
  }, [phase, zone])

  // Global keyboard: P pause/resume | Esc exits fullscreen if active else pause/resume | G toggles fullscreen
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyG') {
        e.preventDefault()
        isFullscreen() ? exitFullscreen() : requestFullscreen()
        return
      }
      if (e.code === 'Escape') {
        if (isFullscreen()) {
          e.preventDefault()
          exitFullscreen()
          return
        }
        if (phase === 'playing') pauseGame()
        else if (phase === 'paused') resumeGame()
        return
      }
      if (e.code === 'KeyP') {
        if (phase === 'playing') pauseGame()
        else if (phase === 'paused') resumeGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pauseGame, resumeGame])

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col md:h-full md:min-h-0">
      <CustomCursor />
      {/* Game stays mounted during zoneout/transition/dying so the 3D world keeps rendering */}
      {(phase === 'playing' || phase === 'paused' || phase === 'transition' || phase === 'dying' || phase === 'zoneout') && <GameScreen />}

      {/* Zone transition overlays the live game */}
      {phase === 'transition' && <ZoneTransition />}

      {/* Other phases */}
      {phase === 'menu'     && <MainMenu />}
      {phase === 'intro'    && <IntroDialogue />}
      {phase === 'gameover' && <GameOver />}
      {phase === 'victory'  && <Victory />}
      {phase === 'credits'  && <EndCredits />}
    </div>
  )
}
