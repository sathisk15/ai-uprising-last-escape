import { useEffect, useRef, useState } from 'react'
import useGameStore from './store/gameStore'
import MainMenu from './screens/MainMenu'
import IntroDialogue from './screens/IntroDialogue'
import GameScreen from './screens/GameScreen'
import GameOver from './screens/GameOver'
import Victory from './screens/Victory'
import ZoneTransition from './screens/ZoneTransition'
import AudioManager from './audio/AudioManager'

function CustomCursor() {
  const pos = useRef({ x: -200, y: -200 })
  const dotRef   = useRef(null)
  const ringRef  = useRef(null)

  useEffect(() => {
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current)  dotRef.current.style.transform  = `translate(${e.clientX}px, ${e.clientY}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

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
    </div>
  )
}
