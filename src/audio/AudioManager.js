import ProceduralBGM from './ProceduralBGM'
import SFXSynth from './SFXSynth'

// ── Public API ───────────────────────────────────────────────────────────────
const AudioManager = {
  /** Start BGM for the given zone. Zone 0 = light ambient (menu/intro). */
  playBGM(zone) {
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

  /** Set BGM volume live (called from the slider in Pause menu) */
  setBGMVolume(v) {
    ProceduralBGM.setVolume(v)
  },

  /** Mute or unmute ALL audio (BGM + SFX). SFX reads audioEnabled from store directly. */
  setMuted(muted) {
    ProceduralBGM.setMuted(muted)
  },

  /** Start the fast boost overlay layer on top of the current zone BGM */
  startBoostBGM() {
    ProceduralBGM.startBoost()
  },

  /** Fade out and remove the boost overlay layer */
  stopBoostBGM() {
    ProceduralBGM.stopBoost()
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
