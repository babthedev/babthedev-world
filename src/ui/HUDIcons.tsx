'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { HUD_ICON_SIZE } from '@/lib/constants'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useWorldStore } from '@/store/useWorldStore'

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

// HUD tiles: light paper squares with a hard offset shadow (Messenger-style),
// inverting to ink on hover and pressing down on click. Icons use currentColor.
const TILE =
  'bg-[#F3F2ED] border-2 border-black flex items-center justify-center text-[#111] cursor-pointer ' +
  'shadow-[4px_4px_0px_0px_#111] transition-[background-color,color,transform,box-shadow] ' +
  'hover:bg-[#111] hover:text-[#F3F2ED] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#111] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]'

export default function HUDIcons() {
  const [mapOpen, setMapOpen] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const gainRef = useRef<GainNode | null>(null)
  const { setMuted, playClick, playShutter } = useAudioManager()
  const setActivePanel = useWorldStore((s) => s.setActivePanel)

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

  const openContact = useCallback(() => {
    playClick()
    setActivePanel('contact')
  }, [playClick, setActivePanel])

  // ── Q104: 1-CLICK 2X SCREENSHOT CAPTURE (PHOTO MODE) ───────
  const handleCapture = useCallback(async () => {
    if (isCapturing) return
    playShutter()
    setIsCapturing(true)

    // Hide UI overlays by setting CSS class on body
    document.body.classList.add('clean-capture-active')

    // Wait 2 frames for paint pass with hidden UI
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    try {
      const webglCanvas = document.querySelector('canvas')
      if (webglCanvas) {
        // Create 2x resolution offscreen canvas
        const offscreen = document.createElement('canvas')
        const scale = 2
        offscreen.width = webglCanvas.width * scale
        offscreen.height = webglCanvas.height * scale
        const ctx = offscreen.getContext('2d')

        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(webglCanvas, 0, 0, offscreen.width, offscreen.height)

          // ── Q104: DISCREET INK STAMP IN THE CORNER ─────────
          const stampWidth = 320
          const stampHeight = 62
          const margin = 32
          const x = offscreen.width - stampWidth - margin
          const y = offscreen.height - stampHeight - margin

          // Drop shadow for stamp
          ctx.fillStyle = '#111111'
          ctx.fillRect(x + 5, y + 5, stampWidth, stampHeight)

          // Stamp background
          ctx.fillStyle = '#FAF9F5'
          ctx.fillRect(x, y, stampWidth, stampHeight)

          // Stamp border
          ctx.strokeStyle = '#111111'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, stampWidth, stampHeight)

          // Inner paper rule
          ctx.strokeStyle = '#D6D3CD'
          ctx.lineWidth = 1
          ctx.strokeRect(x + 4, y + 4, stampWidth - 8, stampHeight - 8)

          // Stamp text
          ctx.fillStyle = '#111111'
          ctx.font = 'bold 18px monospace'
          ctx.fillText('★ BABTHEDEV.COM', x + 16, y + 26)

          ctx.fillStyle = '#555555'
          ctx.font = '12px monospace'
          const dateStr = new Date().toISOString().split('T')[0]
          ctx.fillText(`50M SPHERICAL WORLD • ${dateStr}`, x + 16, y + 47)

          // Export and trigger download
          offscreen.toBlob((blob) => {
            if (!blob) return
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
            a.download = `babworld-${timestamp}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 'image/png')
        }
      }
    } catch (err) {
      console.error('Photo capture failed:', err)
    } finally {
      document.body.classList.remove('clean-capture-active')
      setIsCapturing(false)
      setToastMessage('PHOTO CAPTURED (2X PNG SAVED)')
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null)
      }, 3500)
    }
  }, [isCapturing, playShutter])

  // ── HOTKEY 'P' TO TRIGGER PHOTO MODE ───────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.code === 'KeyP' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        handleCapture()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCapture])

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
          onClick={handleCapture}
          disabled={isCapturing}
          aria-label="Photo Mode / Clean Capture (P)"
          title="Photo Mode / Capture 2x Snapshot (P)"
          className={TILE}
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          <CameraIcon />
        </button>

        <button
          onClick={toggleMap}
          aria-label="Open map"
          className={TILE}
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          <MapIcon />
        </button>

        <button
          onClick={openContact}
          aria-label="Send letter / Contact Abdulrahman"
          className={TILE}
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          <MailIcon />
        </button>

        <button
          onClick={() => {
            playClick()
            setActivePanel('colophon')
          }}
          aria-label="Colophon and credits"
          className={TILE}
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          <InfoIcon />
        </button>

        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className={TILE}
          style={{ width: HUD_ICON_SIZE, height: HUD_ICON_SIZE }}
        >
          {muted ? <MuteIcon /> : <SoundIcon />}
        </button>
      </div>

      {/* ── PHOTO CAPTURED CONFIRMATION TOAST ──────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#FAF9F5] text-black border-2 border-black px-4 py-2 font-mono text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 select-none animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
          <span>{toastMessage}</span>
        </div>
      )}

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

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

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

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}