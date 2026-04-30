import { Howler } from 'howler'
import useGameStore from '../store/gameStore'
import ProceduralBGM from './ProceduralBGM'
import SFXSynth from './SFXSynth'

// ── Public API ───────────────────────────────────────────────────────────────
const AudioManager = {
  /** Sync Howler master volume from store (reserved for any future file-based SFX) */
  sync() {
    const { audioEnabled, masterVolume } = useGameStore.getState()
    Howler.volume(audioEnabled ? masterVolume : 0)
  },

  /** Start BGM for the given zone. Zone 0 = light ambient (menu/intro). */
  playBGM(zone) {
    this.sync()
    ProceduralBGM.play(zone)
  },

  /** Stop BGM with a short fade */
  stopBGM() {
    ProceduralBGM.stop()
  },

  /** Duck BGM volume to ~20% — call when game is paused */
  duckBGM() {
    ProceduralBGM.duck()
  },

  /** Restore BGM to full zone volume — call when resuming from pause */
  unduckBGM() {
    ProceduralBGM.unduck()
  },

  /** Play a one-shot procedural SFX: 'shoot' | 'explosion' | 'hit' */
  playSFX(name) {
    SFXSynth.play(name)
  },

  /** Lane change whoosh */
  playSwipe() {
    SFXSynth.swipe()
  },

  /** Jump launch sweep */
  playJump() {
    SFXSynth.jump()
  },
}

export default AudioManager
