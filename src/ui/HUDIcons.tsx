'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { HUD_ICON_SIZE } from '@/lib/constants'
import {useAudioManager} from '@/hooks/useAudioManager'

const MUTE_STORAGE_KEY = 'babthedev_muted'

// ── GLOBAL AUDIO CONTEXT ──────────────────────────────────────
// A single GainNode at the root of the Web Audio graph.
// Setting gain to 0 silences all audio routed through this context,
// regardless of which library (Howler, Tone.js, raw API) produces it.
// Exported so future audio modules can connect to `masterGain`.
export let audioCtx: AudioContext | null = null
export let masterGain: GainNode | null = null

function getAudioContext(): { ctx: AudioContext; gain: GainNode } {
  if (audioCtx && masterGain) return { ctx: audioCtx, gain: masterGain }
  audioCtx = new AudioContext()
  masterGain = audioCtx.createGain()
  masterGain.connect(audioCtx.destination)
  return { ctx: audioCtx, gain: masterGain }
}

export default function HUDIcons() {
  const [mapOpen, setMapOpen] = useState(false)
  const [muted, setMutedState] = useState(false)
  const gainRef = useRef<GainNode | null>(null)
  const { setMuted } = useAudioManager()

  // ── INITIALISE AUDIO CONTEXT ON FIRST USER GESTURE ──────────
  // Browsers require a user interaction before AudioContext can run.
  // We initialise lazily on first click anywhere in the document.
  useEffect(() => {
    function handleFirstGesture() {
      const { gain } = getAudioContext()
      gainRef.current = gain
      // Apply stored mute preference immediately
      const stored = localStorage.getItem(MUTE_STORAGE_KEY)
      if (stored === 'true') {
        gain.gain.setValueAtTime(0, gain.context.currentTime)
        setMutedState(true)
        setMuted(true)
      }
      window.removeEventListener('pointerdown', handleFirstGesture)
    }
    window.addEventListener('pointerdown', handleFirstGesture)
    return () => window.removeEventListener('pointerdown', handleFirstGesture)
  }, [setMuted])

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev
      localStorage.setItem(MUTE_STORAGE_KEY, String(next))
      setMuted(next)
      return next
    })
  }, [setMuted])

  const toggleMap = useCallback(() => {
    setMapOpen((prev) => !prev)
  }, [])

  // ── ESCAPE CLOSES MAP ────────────────────────────────────
  useEffect(() => {
    if (!mapOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Escape') setMapOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mapOpen])

  return (
    <>
      {/* ── ICON STRIP ─────────────────────────────────── */}
      <div
        className="fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 md:right-6"
        style={{
          // Mobile: move to bottom-right per spec
        }}
      >
        <button
          onClick={toggleMap}
          aria-label="Open map"
          className="bg-black border-2 border-white flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          <MapIcon />
        </button>

        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="bg-black border-2 border-white flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          {muted ? <MuteIcon /> : <SoundIcon />}
        </button>
      </div>

      {/* ── MAP OVERLAY ────────────────────────────────── */}
      {mapOpen && <DistrictMapOverlay onClose={() => setMapOpen(false)} />}
    </>
  )
}

// ─── DISTRICT MAP OVERLAY ─────────────────────────────────

function DistrictMapOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/95 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-merriweather text-2xl mb-8 text-center">
          Site Map
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <MapEntry label="Welcome Terrace" path="/bio" />
          <MapEntry label="The Hub" path="/" />
          <MapEntry label="Projects Exhibition" path="/projects" />
          <MapEntry label="The Library" path="/essays" />
          <MapEntry label="Oryzon" path="#" locked />
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full border-2 border-white text-white py-3 font-inter tracking-wide hover:bg-white hover:text-black transition-colors"
        >
          [ ESC ] CLOSE
        </button>
      </div>
    </div>
  )
}

function MapEntry({
  label,
  path,
  locked = false,
}: {
  label: string
  path: string
  locked?: boolean
}) {
  if (locked) {
    return (
      <div className="border-2 border-dashed border-white/30 px-4 py-3 flex items-center justify-between">
        <span className="text-white/40 font-inter">{label}</span>
        <span className="text-white/40 font-mono text-xs">COMING SOON</span>
      </div>
    )
  }

  return (
    <a
      href={path}
      className="border-2 border-white px-4 py-3 flex items-center justify-between text-white hover:bg-white hover:text-black transition-colors font-inter"
    >
      {label}
      <span className="font-mono text-xs">→</span>
    </a>
  )
}

// ─── ICONS (inline SVG, monochrome, 2px stroke) ────────────

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function MuteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}