// Procedural one-shot SFX using Web Audio API — no audio files required
// Uses the shared AudioContext so ProceduralBGM's user-gesture resume covers SFX too.
import useGameStore from '../store/gameStore'
import { getSharedCtx } from './sharedAudioContext'

function getCtx() {
  return getSharedCtx()
}

function masterVol() {
  const { audioEnabled, masterVolume } = useGameStore.getState()
  return audioEnabled ? masterVolume : 0
}

const SFXSynth = {
  /** Cyberpunk laser blaster — sawtooth frequency sweep down */
  shoot() {
    const v = masterVol(); if (!v) return
    const c = getCtx(); const t = c.currentTime
    const osc  = c.createOscillator()
    const hp   = c.createBiquadFilter()
    const gain = c.createGain()
    hp.type = 'highpass'; hp.frequency.value = 280
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(760, t)
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.11)
    gain.gain.setValueAtTime(v * 0.72, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.connect(hp); hp.connect(gain); gain.connect(c.destination)
    osc.start(t); osc.stop(t + 0.13)
  },

  /** Explosion — noise burst + low-frequency thump */
  explosion() {
    const v = masterVol(); if (!v) return
    const c = getCtx(); const t = c.currentTime

    // White noise burst through lowpass
    const dur  = 0.65
    const buf  = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src  = c.createBufferSource()
    src.buffer = buf
    const lp   = c.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 520
    const g1   = c.createGain()
    g1.gain.setValueAtTime(v * 2.2, t)
    g1.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(lp); lp.connect(g1); g1.connect(c.destination)
    src.start(t)

    // Low-frequency thump sweep
    const osc  = c.createOscillator()
    const g2   = c.createGain()
    osc.frequency.setValueAtTime(110, t)
    osc.frequency.exponentialRampToValueAtTime(26, t + 0.5)
    g2.gain.setValueAtTime(v * 2.6, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
    osc.connect(g2); g2.connect(c.destination)
    osc.start(t); osc.stop(t + 0.6)
  },

  /** Metallic hit / impact — bandpass noise + sharp tone */
  hit() {
    const v = masterVol(); if (!v) return
    const c = getCtx(); const t = c.currentTime
    // Noise crack
    const dur  = 0.12
    const buf  = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src  = c.createBufferSource()
    src.buffer = buf
    const bp   = c.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 3
    const gain = c.createGain()
    gain.gain.setValueAtTime(v * 1.4, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(bp); bp.connect(gain); gain.connect(c.destination)
    src.start(t)
    // Sharp metallic ping
    const osc  = c.createOscillator()
    const g2   = c.createGain()
    osc.type = 'square'; osc.frequency.value = 440
    g2.gain.setValueAtTime(v * 0.9, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(g2); g2.connect(c.destination)
    osc.start(t); osc.stop(t + 0.09)
  },

  /** Lane swipe — highpass noise whoosh */
  swipe() {
    const v = masterVol(); if (!v) return
    const c = getCtx(); const t = c.currentTime
    const dur  = 0.11
    const buf  = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src  = c.createBufferSource()
    src.buffer = buf
    const hp   = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.setValueAtTime(500, t)
    hp.frequency.linearRampToValueAtTime(2600, t + dur)
    const gain = c.createGain()
    gain.gain.setValueAtTime(v * 0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(hp); hp.connect(gain); gain.connect(c.destination)
    src.start(t)
  },

  /** Jump launch — sine sweep upward, sci-fi boost feel */
  jump() {
    const v = masterVol(); if (!v) return
    const c = getCtx(); const t = c.currentTime
    const osc  = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(210, t)
    osc.frequency.exponentialRampToValueAtTime(860, t + 0.19)
    gain.gain.setValueAtTime(v * 0.32, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    osc.connect(gain); gain.connect(c.destination)
    osc.start(t); osc.stop(t + 0.24)
  },

  play(name) {
    try { if (typeof this[name] === 'function') this[name]() } catch (_) {}
  },
}

export default SFXSynth
