// Procedural cyberpunk BGM using Web Audio API — no audio files required

const ZONE_CFG = {
  // Zone 0 — ambient menu/UI music: no drums, soft pads, light arp
  0: {
    bpm: 68,
    root: 49,        // Db1 — haunting, spacious
    scale: [0, 3, 5, 7, 10],
    bassPattern: [0, 0, 3, 0, 5, 0, 0, 7],
    arpSteps: 8,
    masterVol: 0.22,
    ambient: true,
  },
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
    this.delayBus    = null
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

    // Shared arp echo/delay bus — BPM-synced, updated in play()
    this.delayBus  = this.ctx.createDelay(1.0)
    const fb       = this.ctx.createGain()
    const wet      = this.ctx.createGain()
    fb.gain.value  = 0.28
    wet.gain.value = 0.28
    this.delayBus.connect(fb)
    fb.connect(this.delayBus)
    this.delayBus.connect(wet)
    wet.connect(this.master)
  }

  // ── Drum sounds ─────────────────────────────────────────────────────────────

  _kick(t) {
    const { ctx, master } = this
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(master)
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.10)
    gain.gain.setValueAtTime(1.5, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30)
    osc.start(t); osc.stop(t + 0.32)
  }

  _snare(t) {
    const { ctx, master } = this
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const hp   = ctx.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 1400
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.60, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10)
    src.connect(hp); hp.connect(gain); gain.connect(master)
    src.start(t); src.stop(t + 0.12)
    // Tone layer
    const osc = ctx.createOscillator()
    const g2  = ctx.createGain()
    osc.frequency.value = 220
    g2.gain.setValueAtTime(0.32, t)
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

  _bass(t, freq, dur, ambient = false) {
    const { ctx, master } = this
    const osc  = ctx.createOscillator()
    const lp   = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    // Ambient uses sine for a soft sub pulse; gameplay uses sawtooth for grit
    osc.type            = ambient ? 'sine' : 'sawtooth'
    osc.frequency.value = freq
    lp.type             = 'lowpass'
    lp.frequency.value  = ambient ? 260 : 380
    lp.Q.value          = ambient ? 1 : 3
    const vol           = ambient ? 0.38 : 0.55
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(vol, t + (ambient ? 0.04 : 0.015))
    gain.gain.setValueAtTime(vol, t + dur - 0.06)
    gain.gain.linearRampToValueAtTime(0.001, t + dur)
    osc.connect(lp); lp.connect(gain); gain.connect(master)
    osc.start(t); osc.stop(t + dur + 0.05)
  }

  _arp(t, freq, dur) {
    const { ctx, master, delayBus } = this
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
    // Send arp to shared delay bus for BPM-synced echo
    if (delayBus) gain.connect(delayBus)
  }

  _pad(t, freq, dur, ambient = false) {
    const { ctx, master } = this
    const gain = ctx.createGain()
    const lp   = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = ambient ? 1000 : 700
    const attackTime = ambient ? dur * 0.35 : dur * 0.3
    const vol        = ambient ? 0.10 : 0.07
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(vol, t + attackTime)
    gain.gain.linearRampToValueAtTime(0.001, t + dur)
    // Ambient pads use 6 detuned voices for a lush chorus feel
    const detunes = ambient ? [-15, -8, 0, 5, 10, 17] : [-8, 0, 5, 12]
    detunes.forEach(det => {
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
    const beat    = 60 / cfg.bpm
    const half    = beat * 0.5
    const step    = beat * 0.25
    const ambient = !!cfg.ambient

    if (!ambient) {
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
    }

    // Bass line
    cfg.bassPattern.forEach((semi, i) => {
      const freq = cfg.root * Math.pow(2, semi / 12) * 0.5
      this._bass(barStart + i * half, freq, half * 0.88, ambient)
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
      this._pad(barStart, freq, beat * 4, ambient)
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

    const cfg  = ZONE_CFG[zone] ?? ZONE_CFG[1]
    const beat = 60 / cfg.bpm
    const bar  = beat * 4

    // Sync delay bus to zone BPM (1/16-note echo)
    if (this.delayBus) {
      this.delayBus.delayTime.value = beat * 0.25
    }

    // Fade in — slower for ambient, snappier for gameplay
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(0, now)
    this.master.gain.linearRampToValueAtTime(cfg.masterVol, now + (cfg.ambient ? 2.5 : 1.5))

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

  /** Lower master volume to ratio × zone target — used when paused */
  duck(ratio = 0.20) {
    if (!this.master || !this.ctx || !this.running) return
    const cfg = ZONE_CFG[this.currentZone] ?? ZONE_CFG[1]
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(cfg.masterVol * ratio, now + 0.5)
  }

  /** Restore master volume back to zone target — used when resuming */
  unduck() {
    if (!this.master || !this.ctx || !this.running) return
    const cfg = ZONE_CFG[this.currentZone] ?? ZONE_CFG[1]
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(cfg.masterVol, now + 0.6)
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
