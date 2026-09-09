import { useRef, useCallback, useEffect } from 'react'

type SoundName = 'footstep' | 'panelOpen' | 'panelClose' | 'click'

// const SOUND_FILES: Record<SoundName, string> = {
//   footstep: '/audio/footstep.mp3',
//   panelOpen: '/audio/panel-open.mp3',
//   panelClose: '/audio/panel-close.mp3',
//   click: '/audio/click.mp3',
// }

const SOUND_FILES: Record<SoundName, string> = {
    footstep: '/audio/footstep.ogg',
    panelOpen: '/audio/panel-open.ogg',
    panelClose: '/audio/panel-close.ogg',
    click: '/audio/click.ogg',
  }

let sharedContext: AudioContext | null = null
const bufferCache = new Map<SoundName, AudioBuffer>()

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedContext) {
    sharedContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
  }
  return sharedContext
}

export function useAudioManager() {
  const mutedRef = useRef(false)
  const unlockedRef = useRef(false)

  // ── UNLOCK ON FIRST USER GESTURE ─────────────────────────
  // Browsers block audio until user interaction — this listens
  // once, resumes the context, then removes itself.
  useEffect(() => {
    const unlock = () => {
      const ctx = getContext()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume()
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
  }, [])

  const play = useCallback(async (name: SoundName, volume = 0.5) => {
    if (mutedRef.current || !unlockedRef.current) return

    const ctx = getContext()
    if (!ctx) return

    try {
      let buffer = bufferCache.get(name)
      if (!buffer) {
        const res = await fetch(SOUND_FILES[name])
        // Audio decode failures fail silently per spec —
        // visual experience continues uninterrupted
        const arrayBuffer = await res.arrayBuffer()
        buffer = await ctx.decodeAudioData(arrayBuffer)
        bufferCache.set(name, buffer)
      }

      const source = ctx.createBufferSource()
      const gainNode = ctx.createGain()
      gainNode.gain.value = volume
      source.buffer = buffer
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      source.start(0)
    } catch {
      // Silent fail — audio is non-critical
    }
  }, [])

  return { play, setMuted }
}