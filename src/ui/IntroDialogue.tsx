'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { INTRO_SEQUENCE } from '@/lib/dialogue'
import { INTRO_AUTO_DISMISS_MS } from '@/lib/constants'
import { useAudioManager } from '@/hooks/useAudioManager'

export default function IntroDialogue() {
  const introComplete = useWorldStore((s) => s.introComplete)
  const setIntroComplete = useWorldStore((s) => s.setIntroComplete)
  const setTourActive = useWorldStore((s) => s.setTourActive)
  const { playDialogueBlip, playTypewriterTap } = useAudioManager()

  const [lineIndex, setLineIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [displayedText, setDisplayedText] = useState('')
  const indexRef = useRef(0)

  const currentLine = INTRO_SEQUENCE[lineIndex]
  const isLastLine = lineIndex === INTRO_SEQUENCE.length - 1

  // ── Q137: TYPEWRITER CHIRPS FOR INTRO ────────────────────
  useEffect(() => {
    setDisplayedText('')
    indexRef.current = 0
    const text = currentLine.text

    const interval = setInterval(() => {
      indexRef.current++
      if (indexRef.current <= text.length) {
        setDisplayedText(text.slice(0, indexRef.current))
        const char = text[indexRef.current - 1]
        if (char && char.trim()) {
          const pitchOffset = ((indexRef.current % 4) - 1.5) * 0.15
          playDialogueBlip(pitchOffset)
        }
      } else {
        clearInterval(interval)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [lineIndex, currentLine.text, playDialogueBlip])

  const finishIntro = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setIntroComplete(true)
      setTourActive(true) // Guided tour begins immediately after intro
    }, 400)
  }, [setIntroComplete, setTourActive])

  const advance = useCallback(() => {
    playTypewriterTap()
    if (isLastLine) {
      finishIntro()
    } else {
      setLineIndex((i) => i + 1)
    }
  }, [isLastLine, finishIntro, playTypewriterTap])

  // ── AUTO-DISMISS AFTER 7 SECONDS ────────────────────────
  // Per spec: visitor can click through manually, OR it
  // auto-advances to the world after 7s of total inactivity.
  useEffect(() => {
    if (introComplete) return
    const timer = setTimeout(finishIntro, INTRO_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [introComplete, finishIntro])

  // ── SPACE / ENTER TO ADVANCE ────────────────────────────
  useEffect(() => {
    if (introComplete) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [introComplete, advance])

  if (introComplete) return null

  return (
    <div
      className={`fixed inset-0 z-30 flex items-end justify-center pb-12 px-6 transition-opacity duration-400 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="w-full max-w-2xl">
        {/* Name badge — brutalist style */}
        <div className="inline-block bg-black text-white font-bold font-mono px-4 py-1.5 mb-0 text-sm tracking-widest border-2 border-black">
          ABDULRAHMAN
        </div>

        {/* Dialogue panel */}
        <div className="bg-white border-2 border-black px-6 py-5 flex items-center justify-between gap-4 mt-0">
  <p className="text-black font-mono text-lg leading-relaxed min-h-[2.5rem]">
    {displayedText}
  </p>
  <button
    onClick={advance}
    className="flex-shrink-0 w-10 h-10 border-2 border-black bg-black text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors font-mono"
  >
    ▶
  </button>
</div>

        {/* Line progress dots */}
        <div className="flex gap-1.5 mt-3 justify-center">
          {INTRO_SEQUENCE.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-6 transition-colors ${
                i <= lineIndex ? 'bg-black' : 'bg-black/15'
              }`}
            />
          ))}
        </div>

        {/* Skip hint */}
        <p className="text-center text-black/40 font-mono text-xs mt-4 tracking-widest">
          PRESS SPACE TO CONTINUE
        </p>
      </div>
    </div>
  )
}