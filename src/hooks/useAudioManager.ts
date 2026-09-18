'use client'

import { useRef, useCallback, useEffect } from 'react'

let sharedContext: AudioContext | null = null
let masterGainNode: GainNode | null = null
let districtFilterNode: BiquadFilterNode | null = null

function getAudioGraph(): {
  ctx: AudioContext
  masterGain: GainNode
  districtFilter: BiquadFilterNode
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
  }

  return {
    ctx: sharedContext,
    masterGain: masterGainNode!,
    districtFilter: districtFilterNode!,
  }
}

export function useAudioManager() {
  const mutedRef = useRef(false)
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

    // Random pitch jitter ±4% (0.96 to 1.04)
    const jitter = 0.96 + Math.random() * 0.08
    const baseFreq = 72 * jitter

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

  return {
    setMuted,
    setDistrict,
    playDialogueBlip,
    playFootstep,
    playArrivalChime,
    playClick,
  }
}