'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useTelemetry } from '@/hooks/useTelemetry'

interface GuestbookEntry {
  id: string
  name: string
  message: string
  stamp: string
  date: string
}

const STAMPS = ['☕', '✦', '📜', '🕊️', '✒️']

export default function GuestbookModal() {
  const activePanel = useWorldStore((s) => s.activePanel)
  const setActivePanel = useWorldStore((s) => s.setActivePanel)
  const { playPageTurn, playTypewriterTap, playClick } = useAudioManager()
  const { trackEvent } = useTelemetry()

  const isOpen = activePanel === 'guestbook'

  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [selectedStamp, setSelectedStamp] = useState(STAMPS[0])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleClose = useCallback(() => {
    playPageTurn()
    setActivePanel(null)
  }, [playPageTurn, setActivePanel])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Load entries when opening
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/guestbook')
      .then((res) => res.json())
      .then((data) => {
        if (data.entries) setEntries(data.entries)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !message.trim()) {
      setError('Please provide both your name and a brief note.')
      return
    }

    playClick()

    const optimisticEntry: GuestbookEntry = {
      id: `temp-${Date.now()}`,
      name: name.trim(),
      message: message.trim(),
      stamp: selectedStamp,
      date: new Date().toISOString().split('T')[0],
    }

    setEntries((prev) => [optimisticEntry, ...prev])
    const currentName = name
    const currentMsg = message
    setName('')
    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/guestbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentName,
            message: currentMsg,
            stamp: selectedStamp,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to pin note.')
        } else {
          trackEvent('guestbook_signed', { stamp: selectedStamp })
          playPageTurn()
        }
      } catch {
        setError('Network error while pinning note.')
      }
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cafe Terrace Guestbook"
    >
      <div
        className="relative w-full max-w-2xl bg-[#ECE7DC] border-4 border-black p-6 md:p-8 text-[#111111] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close guestbook"
          className="absolute top-5 right-5 w-8 h-8 border-2 border-black bg-white flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
        >
          <span className="font-mono text-sm leading-none">✕</span>
        </button>

        {/* Header */}
        <div className="mb-6 border-b-2 border-black pb-4 pr-10">
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">
            JOE&apos;S CAFE TERRACE • VISITOR REGISTER
          </span>
          <h2 className="font-merriweather text-2xl md:text-3xl font-bold text-black">
            The Terrace Corkboard
          </h2>
          <p className="font-inter text-xs text-black/70 mt-1">
            Pin a short thought or footprint before you loop back to the Hub.
          </p>
        </div>

        {/* Pinned Notes Grid */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[220px] max-h-[360px] pb-4">
          {loading && entries.length === 0 && (
            <div className="py-12 text-center font-mono text-xs text-black/50">
              READING PINNED NOTES...
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`relative p-4 border-2 border-black bg-[#FAF9F5] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] ${
                  index % 2 === 0 ? '-rotate-0.5' : 'rotate-0.5'
                }`}
              >
                {/* Visual Pushpin */}
                <div className="w-2.5 h-2.5 bg-black rounded-full border border-white mx-auto -mt-2.5 mb-2 shadow-sm" />

                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[11px] font-bold text-black uppercase tracking-wider">
                    {entry.name}
                  </span>
                  <span className="text-sm select-none" title="Ink stamp">
                    {entry.stamp}
                  </span>
                </div>

                <p className="font-inter text-xs text-black/85 leading-relaxed break-words">
                  &ldquo;{entry.message}&rdquo;
                </p>

                <div className="mt-3 pt-2 border-t border-black/10 flex justify-end">
                  <span className="font-mono text-[9px] text-black/40">
                    {entry.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pin a Note Form */}
        <div className="mt-4 pt-4 border-t-2 border-black bg-[#F5F2EA] p-4 -mx-2 -mb-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2 border border-red-700 bg-red-50 text-red-900 font-mono text-[11px]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <input
                  type="text"
                  required
                  maxLength={30}
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    playTypewriterTap()
                  }}
                  className="w-full border-2 border-black bg-white px-3 py-1.5 font-inter text-xs text-black placeholder:text-black/40 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Leave a short note (max 100 chars)..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      playTypewriterTap()
                    }}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 pr-14 font-inter text-xs text-black placeholder:text-black/40 focus:outline-none"
                  />
                  <span className="absolute right-2 top-2 font-mono text-[9px] text-black/40">
                    {message.length}/100
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-black/60 uppercase mr-1">
                  Stamp:
                </span>
                {STAMPS.map((stamp) => (
                  <button
                    key={stamp}
                    type="button"
                    onClick={() => {
                      setSelectedStamp(stamp)
                      playClick()
                    }}
                    className={`w-7 h-7 flex items-center justify-center text-xs border ${
                      selectedStamp === stamp
                        ? 'border-black bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-black/30 bg-white hover:border-black'
                    }`}
                  >
                    {stamp}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-1.5 border-2 border-black bg-black text-white font-mono text-xs font-bold tracking-wider uppercase hover:bg-white hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isPending ? 'Pinning...' : 'Pin Note 📌'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
