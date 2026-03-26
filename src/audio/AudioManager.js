import { Howl, Howler } from 'howler'
import useGameStore from '../store/gameStore'

// ── Placeholder paths — drop real audio files in /public/audio/ ─────────────
// BGM loops per zone (place .mp3 files in public/audio/)
const BGM_PATHS = {
  1: '/audio/bgm_zone1.mp3',
  2: '/audio/bgm_zone2.mp3',
  3: '/audio/bgm_zone3.mp3',
}

// SFX one-shots
const SFX_PATHS = {
  shoot:         '/audio/sfx_shoot.mp3',
  explosion:     '/audio/sfx_explosion.mp3',
  hit:           '/audio/sfx_hit.mp3',
  pickup:        '/audio/sfx_pickup.mp3',
  zone_complete: '/audio/sfx_zone_complete.mp3',
  game_over:     '/audio/sfx_game_over.mp3',
  victory:       '/audio/sfx_victory.mp3',
}

// ── Singleton state ──────────────────────────────────────────────────────────
let currentBGM = null
let currentBGMZone = null
const sfxCache = {}

function getSFX(name) {
  if (!sfxCache[name]) {
    sfxCache[name] = new Howl({
      src: [SFX_PATHS[name]],
      volume: 0.6,
      // Silently ignore missing files in dev
      onloaderror: () => {},
    })
  }
  return sfxCache[name]
}

// ── Public API ───────────────────────────────────────────────────────────────
const AudioManager = {
  /** Sync Howler master volume + mute from store */
  sync() {
    const { audioEnabled, masterVolume } = useGameStore.getState()
    Howler.volume(audioEnabled ? masterVolume : 0)
  },

  /** Start looping BGM for the given zone (1-3). No-op if already playing. */
  playBGM(zone) {
    this.sync()
    if (currentBGMZone === zone && currentBGM && currentBGM.playing()) return

    this.stopBGM()

    currentBGM = new Howl({
      src: [BGM_PATHS[zone]],
      loop: true,
      volume: 0.45,
      // Silently ignore missing files in dev
      onloaderror: () => {},
    })
    currentBGM.play()
    currentBGMZone = zone
  },

  /** Stop current BGM with a short fade */
  stopBGM() {
    if (currentBGM) {
      currentBGM.fade(currentBGM.volume(), 0, 400)
      setTimeout(() => { currentBGM && currentBGM.stop() }, 450)
      currentBGM = null
      currentBGMZone = null
    }
  },

  /** Play a one-shot SFX by name */
  playSFX(name) {
    this.sync()
    if (!SFX_PATHS[name]) return
    try {
      getSFX(name).play()
    } catch (_) {}
  },
}

export default AudioManager
