import useGameStore from '../store/gameStore'
import GameCanvas from '../game/GameCanvas'
import HUD from '../components/hud/HUD'
import PauseMenu from './PauseMenu'
import useTouchInput from '../components/player/useTouchInput'

function TouchLayer() {
  useTouchInput()
  return null
}


export default function GameScreen() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="w-full h-full relative">
      <TouchLayer />
      <GameCanvas />
      <HUD />
      {phase === 'paused' && <PauseMenu />}
    </div>
  )
}
