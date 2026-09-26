'use client'

import { useRef, useCallback, useEffect } from 'react'

let sharedContext: AudioContext | null = null
let masterGainNode: GainNode | null = null
let districtFilterNode: BiquadFilterNode | null = null
let humGainNode: GainNode | null = null
let humOsc60: OscillatorNode | null = null
let humOsc120: OscillatorNode | null = null

let noiseBuffer: AudioBuffer | null = null
let ambienceStarted = false

/** Two seconds of softened noise, made once and reused by every whoosh, step and the ambient bed. */
function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = ctx.sampleRate * 2
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      // a leaky integrator turns white noise into a rounder, pink-ish hiss
      last = last * 0.86 + (Math.random() * 2 - 1) * 0.14
      data[i] = last * 3.2
    }
  }
  return noiseBuffer
}

function getAudioGraph(): {
  ctx: AudioContext
  masterGain: GainNode
  districtFilter: BiquadFilterNode
  humGain: GainNode
} | null {
  if (typeof window === 'undefined') return null

  if (!sharedContext) {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    sharedContext = new AudioCtx()

    // Master Gain for global volume and muting
    masterGainNode = sharedContext.createGain()
    masterGainNode.gain.value = 1.0

    // Q138: District-aware lowpass filter node
    districtFilterNode = sharedContext.createBiquadFilter()
    districtFilterNode.type = 'lowpass'
    districtFilterNode.frequency.value = 2400
    districtFilterNode.Q.value = 1.0

    // Graph routing: sources -> districtFilter -> masterGain -> destination
    districtFilterNode.connect(masterGainNode)
    masterGainNode.connect(sharedContext.destination)

    // Q140: 404 alley continuous electrical hum (60Hz + 120Hz harmonics)
    humGainNode = sharedContext.createGain()
    humGainNode.gain.value = 0.0 // starts silent

    humOsc60 = sharedContext.createOscillator()
    humOsc60.type = 'sawtooth'
    humOsc60.frequency.value = 60

    humOsc120 = sharedContext.createOscillator()
    humOsc120.type = 'sine'
    humOsc120.frequency.value = 120

    const humFilter = sharedContext.createBiquadFilter()
    humFilter.type = 'lowpass'
    humFilter.frequency.value = 240

    humOsc60.connect(humFilter)
    humOsc120.connect(humFilter)
    humFilter.connect(humGainNode)
    humGainNode.connect(masterGainNode)

    try {
      humOsc60.start()
      humOsc120.start()
    } catch {
      // ignore if autoplay prevents starting immediately
    }
  }

  return {
    ctx: sharedContext,
    masterGain: masterGainNode!,
    districtFilter: districtFilterNode!,
    humGain: humGainNode!,
  }
}

export function useAudioManager() {
  const mutedRef = useRef(false)
  const footSide = useRef(0)
  const unlockedRef = useRef(false)

  // ── UNLOCK ON FIRST USER GESTURE (Q140) ───────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check stored mute setting
    const stored = localStorage.getItem('babthedev_muted')
    if (stored === 'true') {
      mutedRef.current = true
      const graph = getAudioGraph()
      if (graph) {
        graph.masterGain.gain.setValueAtTime(0, graph.ctx.currentTime)
      }
    }

    const unlock = () => {
      const graph = getAudioGraph()
      if (graph && graph.ctx.state === 'suspended') {
        graph.ctx.resume()
      }
      unlockedRef.current = true
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }

    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    mutedRef.current = muted
    const graph = getAudioGraph()
    if (graph) {
      const now = graph.ctx.currentTime
      graph.masterGain.gain.cancelScheduledValues(now)
      graph.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, now)
    }
  }, [])

  // ── Q138: DISTRICT-AWARE LOWPASS FILTER ──────────────────
  const setDistrict = useCallback((district: string) => {
    const graph = getAudioGraph()
    if (!graph) return

    const now = graph.ctx.currentTime
    // Library: rolls off to 800Hz for cozy warmth; Projects: opens to 4000Hz; Hub/Bio: 2400Hz
    let targetCutoff = 2400
    if (district === '/essays') {
      targetCutoff = 800
    } else if (district === '/projects') {
      targetCutoff = 4000
    } else if (district === '/404') {
      targetCutoff = 1100
    }

    graph.districtFilter.frequency.setTargetAtTime(targetCutoff, now, 0.6)
  }, [])

  // ── Q137: DIALOGUE VOICE CHIRP (12Hz warm marimba blip) ──
  const playDialogueBlip = useCallback((pitchVariance = 0) => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    const baseFreq = 380 + pitchVariance * 60
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(baseFreq, now)
    // Fast frequency drop creates warm marimba wood strike
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.045)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

    osc.connect(gain)
    gain.connect(graph.districtFilter)

    osc.start(now)
    osc.stop(now + 0.05)
  }, [])

  // ── Q139: FOOTSTEP WITH ±4% RANDOM PITCH JITTER (-14dB) ──
  const playFootstep = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    // Feet alternate: a touch lower and duller on one side
    footSide.current = footSide.current === 0 ? 1 : 0
    const left = footSide.current === 0

    // Random pitch jitter ±4% (0.96 to 1.04)
    const jitter = 0.96 + Math.random() * 0.08
    const baseFreq = (left ? 66 : 74) * jitter

    // The scuff: a short band of noise, what makes it a shoe on pavement and not a tap
    const scuff = ctx.createBufferSource()
    scuff.buffer = getNoise(ctx)
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = (left ? 1500 : 1800) * jitter
    band.Q.value = 0.8
    const scuffGain = ctx.createGain()
    scuffGain.gain.setValueAtTime(0.075, now)
    scuffGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    scuff.connect(band)
    band.connect(scuffGain)
    scuffGain.connect(graph.districtFilter)
    scuff.start(now, Math.random() * 1.5)
    scuff.stop(now + 0.07)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.055)

    // -14dB corresponds to ~0.20 gain
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)

    osc.connect(gain)
    gain.connect(graph.districtFilter)

    osc.start(now)
    osc.stop(now + 0.06)
  }, [])

  // ── Q118: GENTLE 2-NOTE ARRIVAL CHIME ────────────────────
  const playArrivalChime = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    const notes = [
      { freq: 523.25, time: 0, dur: 0.35 },    // C5
      { freq: 659.25, time: 0.12, dur: 0.45 },  // E5
    ]

    for (const note of notes) {
      const start = now + note.time
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(note.freq, start)

      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur)

      osc.connect(gain)
      gain.connect(graph.districtFilter)

      osc.start(start)
      osc.stop(start + note.dur + 0.05)
    }
  }, [])

  // ── UI CLICK ─────────────────────────────────────────────
  const playClick = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

    osc.connect(gain)
    gain.connect(graph.masterGain)

    osc.start(now)
    osc.stop(now + 0.025)
  }, [])

  // ── Q140: 404 ALLEY ELECTRICAL HUM (distance-attenuated 60Hz + 120Hz buzz) ──
  const updateElectricalHum = useCallback((distanceTo404: number, flickerModulation = 0) => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running' || !graph.humGain) return

    const now = graph.ctx.currentTime
    const maxRadius = 14.0 // hear hum within 14 meters of the 404 alley lamp
    const proximity = Math.max(0, 1.0 - distanceTo404 / maxRadius)
    // Non-linear cubic falloff with slight flicker modulation
    const flickerFactor = 1.0 + flickerModulation * 0.25
    const targetGain = proximity * proximity * 0.12 * flickerFactor

    graph.humGain.gain.setTargetAtTime(targetGain, now, 0.1)
  }, [])

  // ── Q69: TACTILE PAPER PAGE SLIDE / TURN ───────────────────
  const playPageTurn = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    // Generate white noise buffer
    const bufferSize = Math.floor(ctx.sampleRate * 0.08)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // Filter to paper scrape sound (bandpass ~2.4kHz sweeping to 1.2kHz)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2600, now)
    filter.frequency.exponentialRampToValueAtTime(1100, now + 0.08)
    filter.Q.value = 1.6

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(graph.masterGain)

    noise.start(now)
  }, [])

  // ── Q69: TACTILE TYPEWRITER KEY TAP ────────────────────────
  const playTypewriterTap = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.02)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

    osc.connect(gain)
    gain.connect(graph.masterGain)

    osc.start(now)
    osc.stop(now + 0.025)
  }, [])

  // ── Q103: ENVIRONMENTAL WIND WHISPER (faint filtered noise sweep) ──
  const playWindWhisper = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    // Generate 3.5s smooth noise buffer
    const duration = 3.5
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      // Pinkish noise filter approximation
      data[i] = (Math.random() * 2 - 1) * 0.7
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // Soft bandpass filter sweeping from 320Hz -> 820Hz -> 280Hz
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(320, now)
    filter.frequency.exponentialRampToValueAtTime(820, now + 1.4)
    filter.frequency.exponentialRampToValueAtTime(280, now + duration)
    filter.Q.value = 2.2

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 1.2)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(graph.masterGain)

    noise.start(now)
  }, [])

  // ── Q104: MECHANICAL CAMERA SHUTTER & INK STAMP CLICK ────────
  const playShutter = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return

    const ctx = graph.ctx
    const now = ctx.currentTime

    // Shutter blade opening click
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(1400, now)
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.02)
    gain1.gain.setValueAtTime(0.18, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02)
    osc1.connect(gain1)
    gain1.connect(graph.masterGain)
    osc1.start(now)
    osc1.stop(now + 0.025)

    // Secondary shutter mirror return (65ms later)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(800, now + 0.065)
    osc2.frequency.exponentialRampToValueAtTime(120, now + 0.09)
    gain2.gain.setValueAtTime(0.14, now + 0.065)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.095)
    osc2.connect(gain2)
    gain2.connect(graph.masterGain)
    osc2.start(now + 0.065)
    osc2.stop(now + 0.1)
  }, [])

  // ── AMBIENT BED ──────────────────────────────────────────
  // A low, slow room-tone of air: filtered noise that swells and falls over about
  // fourteen seconds, so the world is never dead silent. It runs through the
  // district filter, so the Library is duller and the Exhibition brighter. Idempotent:
  // call it as often as you like; it starts once, when audio is allowed to run.
  const startAmbience = useCallback(() => {
    if (ambienceStarted || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return
    ambienceStarted = true
    if (process.env.NODE_ENV !== 'production') (window as unknown as Record<string, unknown>).__AMBIENCE__ = true
    const ctx = graph.ctx

    const air = ctx.createBufferSource()
    air.buffer = getNoise(ctx)
    air.loop = true
    const soften = ctx.createBiquadFilter()
    soften.type = 'lowpass'
    soften.frequency.value = 480
    const level = ctx.createGain()
    level.gain.value = 0

    const swell = ctx.createOscillator()
    swell.frequency.value = 0.07
    const swellDepth = ctx.createGain()
    swellDepth.gain.value = 0.009
    swell.connect(swellDepth)
    swellDepth.connect(level.gain)

    air.connect(soften)
    soften.connect(level)
    level.connect(graph.districtFilter)
    level.gain.setTargetAtTime(0.03, ctx.currentTime, 2.5) // fades in over about five seconds
    air.start()
    swell.start()
  }, [])

  // ── HOVER TICK ───────────────────────────────────────────
  const playHover = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return
    const ctx = graph.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1900, now)
    gain.gain.setValueAtTime(0.022, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.014)
    osc.connect(gain)
    gain.connect(graph.masterGain)
    osc.start(now)
    osc.stop(now + 0.02)
  }, [])

  // ── WHOOSH: the map opening (rising) or closing (falling), and travel ──
  const playWhoosh = useCallback((rising = true) => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return
    const ctx = graph.ctx
    const now = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = getNoise(ctx)
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 1.1
    band.frequency.setValueAtTime(rising ? 300 : 2200, now)
    band.frequency.exponentialRampToValueAtTime(rising ? 2200 : 300, now + 0.32)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36)
    src.connect(band)
    band.connect(gain)
    gain.connect(graph.masterGain)
    src.start(now, Math.random() * 1.5)
    src.stop(now + 0.4)
  }, [])

  // ── THUD: landing after a jump across town ───────────────
  const playThud = useCallback(() => {
    if (mutedRef.current || !unlockedRef.current) return
    const graph = getAudioGraph()
    if (!graph || graph.ctx.state !== 'running') return
    const ctx = graph.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, now)
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14)
    gain.gain.setValueAtTime(0.24, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
    osc.connect(gain)
    gain.connect(graph.districtFilter)
    osc.start(now)
    osc.stop(now + 0.18)
  }, [])

  return {
    startAmbience,
    playHover,
    playWhoosh,
    playThud,
    setMuted,
    setDistrict,
    playDialogueBlip,
    playFootstep,
    playArrivalChime,
    playClick,
    updateElectricalHum,
    playPageTurn,
    playTypewriterTap,
    playWindWhisper,
    playShutter,
  }
}