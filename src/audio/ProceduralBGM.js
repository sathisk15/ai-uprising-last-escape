// Procedural cyberpunk BGM using Web Audio API — no audio files required

const ZONE_CFG = {
  1: {
    bpm: 95,
    root: 55,        // A1 — dark, heavy
    scale: [0, 3, 5, 7, 10],
    bassPattern:  [0, 0, 7, 0, 5, 0, 3, 5],
    arpSteps: 16,
    masterVol: 0.38,
  },
  2: {
    bpm: 120,
    root: 65,        // F2 — industrial, driving
    scale: [0, 2, 5, 7, 9],
    bassPattern:  [0, 5, 0, 7, 3, 0, 5, 7],
    arpSteps: 16,
    masterVol: 0.40,
  },
  3: {
    bpm: 148,
    root: 73,        // C#2 — intense, relentless
    scale: [0, 1, 5, 7, 8],
    bassPattern:  [0, 3, 5, 0, 7, 5, 3, 0],
    arpSteps: 32,
    masterVol: 0.42,
  },
}

class ProceduralBGM {
  constructor() {
    this.ctx         = null
    this.master      = null
    this.running     = false
    this.currentZone = null
    this.timer       = null
    this.nextBar     = 0
  }

  _init() {
    if (this.ctx) return
    this.ctx    = new (window.AudioContext || window.webkitAudioContext)()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(this.ctx.destination)
  }

  // ── Drum sounds ─────────────────────────────────────────────────────────────

  _kick(t) {
    const { ctx, master } = this
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(master)
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.09)
    gain.gain.setValueAtTime(1.4, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
    osc.start(t); osc.stop(t + 0.3)
  }

  _snare(t) {
    const { ctx, master } = this
    // White noise burst
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const hp   = ctx.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 1200
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.55, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    src.connect(hp); hp.connect(gain); gain.connect(master)
    src.start(t); src.stop(t + 0.12)
    // Tone layer
    const osc = ctx.createOscillator()
    const g2  = ctx.createGain()
    osc.frequency.value = 200
    g2.gain.setValueAtTime(0.3, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    osc.connect(g2); g2.connect(master)
    osc.start(t); osc.stop(t + 0.07)
  }

  _hihat(t, vol = 0.12, open = false) {
    const { ctx, master } = this
    const dur  = open ? 0.18 : 0.04
    const buf  = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const hp   = ctx.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 9000
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9)
    src.connect(hp); hp.connect(gain); gain.connect(master)
    src.start(t); src.stop(t + dur)
  }

  // ── Melodic sounds ───────────────────────────────────────────────────────────

  _bass(t, freq, dur) {
    const { ctx, master } = this
    const osc  = ctx.createOscillator()
    const lp   = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'; osc.frequency.value = freq
    lp.type  = 'lowpass';  lp.frequency.value  = 380; lp.Q.value = 3
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.55, t + 0.015)
    gain.gain.setValueAtTime(0.55, t + dur - 0.04)
    gain.gain.linearRampToValueAtTime(0.001, t + dur)
    osc.connect(lp); lp.connect(gain); gain.connect(master)
    osc.start(t); osc.stop(t + dur + 0.05)
  }

  _arp(t, freq, dur) {
    const { ctx, master } = this
    // Two slightly detuned oscillators for fatness
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.09, t + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.75)
    ;[0, 6].forEach(detuneCent => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq * 2
      osc.detune.value    = detuneCent
      osc.connect(gain)
      osc.start(t); osc.stop(t + dur)
    })
    gain.connect(master)
  }

  _pad(t, freq, dur) {
    const { ctx, master } = this
    const gain = ctx.createGain()
    const lp   = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 700
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.07, t + dur * 0.3)
    gain.gain.linearRampToValueAtTime(0.001, t + dur)
    ;[-8, 0, 5, 12].forEach(det => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      osc.detune.value = det * 10
      osc.connect(lp)
      osc.start(t); osc.stop(t + dur + 0.1)
    })
    lp.connect(gain); gain.connect(master)
  }

  // ── Bar scheduler ────────────────────────────────────────────────────────────

  _scheduleBar(barStart, cfg) {
    const beat = 60 / cfg.bpm
    const half = beat * 0.5
    const step = beat * 0.25

    // Kick: beat 1 and 3
    this._kick(barStart)
    this._kick(barStart + beat * 2)

    // Snare: beat 2 and 4
    this._snare(barStart + beat)
    this._snare(barStart + beat * 3)

    // Hihats: every 8th, open on offbeats
    for (let i = 0; i < 8; i++) {
      this._hihat(barStart + i * half, 0.14, i % 2 !== 0)
    }

    // Bass line
    cfg.bassPattern.forEach((semi, i) => {
      const freq = cfg.root * Math.pow(2, semi / 12) * 0.5
      this._bass(barStart + i * half, freq, half * 0.88)
    })

    // Arp melody
    for (let i = 0; i < cfg.arpSteps; i++) {
      const semi = cfg.scale[i % cfg.scale.length]
      const oct  = i < cfg.arpSteps / 2 ? 12 : 24
      const freq = cfg.root * Math.pow(2, (semi + oct) / 12)
      this._arp(barStart + i * (beat * 4 / cfg.arpSteps), freq, step * 0.85)
    }

    // Pad chord — whole bar
    const chordSemis = [0, cfg.scale[1], cfg.scale[2], cfg.scale[3]]
    chordSemis.forEach(semi => {
      const freq = cfg.root * Math.pow(2, (semi + 12) / 12)
      this._pad(barStart, freq, beat * 4)
    })
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  play(zone) {
    this._init()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    if (this.running && this.currentZone === zone) return

    this.stop(false)
    this.running     = true
    this.currentZone = zone

    const cfg  = ZONE_CFG[zone] || ZONE_CFG[1]
    const beat = 60 / cfg.bpm
    const bar  = beat * 4

    // Fade in
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(0, now)
    this.master.gain.linearRampToValueAtTime(cfg.masterVol, now + 1.5)

    this.nextBar = now + 0.05

    const tick = () => {
      if (!this.running) return
      const lookahead = this.ctx.currentTime + 1.2
      while (this.nextBar < lookahead) {
        this._scheduleBar(this.nextBar, cfg)
        this.nextBar += bar
      }
      this.timer = setTimeout(tick, 250)
    }
    tick()
  }

  stop(fade = true) {
    this.running     = false
    this.currentZone = null
    clearTimeout(this.timer)
    this.timer = null

    if (this.master && this.ctx) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      if (fade) {
        this.master.gain.setValueAtTime(this.master.gain.value, now)
        this.master.gain.linearRampToValueAtTime(0, now + 0.6)
      } else {
        this.master.gain.value = 0
      }
    }
  }

  setVolume(v) {
    if (this.master && this.running) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setValueAtTime(this.master.gain.value, now)
      this.master.gain.linearRampToValueAtTime(v * 0.42, now + 0.3)
    }
  }
}

export default new ProceduralBGM()
