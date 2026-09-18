'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useTelemetry } from '@/hooks/useTelemetry'

export default function ContactModal() {
  const activePanel = useWorldStore((s) => s.activePanel)
  const setActivePanel = useWorldStore((s) => s.setActivePanel)
  const { playPageTurn, playTypewriterTap, playClick } = useAudioManager()
  const { trackEvent } = useTelemetry()

  const isOpen = activePanel === 'contact'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleClose = useCallback(() => {
    playPageTurn()
    setActivePanel(null)
    setTimeout(() => {
      setError(null)
      setSuccess(false)
    }, 300)
  }, [playPageTurn, setActivePanel])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.')
      return
    }

    playClick()

    startTransition(async () => {
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to deliver letter.')
        } else {
          setSuccess(true)
          trackEvent('letter_sent', { subject })
          playPageTurn()
          setName('')
          setEmail('')
          setSubject('')
          setMessage('')
        }
      } catch {
        setError('Network error. Could not deliver letter.')
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
      aria-label="Send a letter to Abdulrahman"
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF9F5] border-2 border-black p-6 md:p-8 text-[#111111] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Stamp Decoration */}
        <div className="absolute top-6 right-16 hidden sm:block border-2 border-dashed border-black/50 p-2 text-center rotate-2 bg-white/70">
          <p className="font-mono text-[9px] font-bold tracking-widest uppercase text-black/70">
            AIR MAIL
          </p>
          <p className="font-mono text-[8px] tracking-wider text-black/50">
            50M SPHERE
          </p>
          <p className="font-mono text-[9px] font-bold text-black mt-0.5">
            POSTAGE PAID
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close letter modal"
          className="absolute top-5 right-5 w-8 h-8 border-2 border-black bg-white flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="font-mono text-sm leading-none">✕</span>
        </button>

        {/* Title & Subtext */}
        <div className="mb-6">
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-black/50 block mb-1">
            DISPATCH FROM WELCOME TERRACE
          </span>
          <h2 className="font-merriweather text-2xl font-bold text-black">
            Send a Letter to Abdulrahman
          </h2>
          <p className="font-inter text-xs text-black/70 mt-1">
            Have a project, inquiry, or question? Send a note directly to my desk.
          </p>
        </div>

        {success ? (
          <div className="p-6 border-2 border-black bg-white text-center my-4 space-y-3">
            <div className="inline-block p-2 border border-black rounded-full text-lg">
              ✉
            </div>
            <h3 className="font-merriweather text-lg font-bold text-black">
              Letter Sealed & Sent
            </h3>
            <p className="font-inter text-xs text-black/70 max-w-xs mx-auto">
              Your message has been dropped into the postal box and delivered to
              Abdulrahman. I&apos;ll reply to your email soon.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2 border-2 border-black bg-black text-white font-mono text-xs font-bold tracking-wider uppercase hover:bg-white hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Return to World
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 border-2 border-red-700 bg-red-50 text-red-900 font-mono text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] font-bold tracking-wider uppercase text-black mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    playTypewriterTap()
                  }}
                  placeholder="Ada Lovelace"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-inter text-xs text-black placeholder:text-black/30 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold tracking-wider uppercase text-black mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    playTypewriterTap()
                  }}
                  placeholder="ada@example.com"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-inter text-xs text-black placeholder:text-black/30 focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold tracking-wider uppercase text-black mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  playTypewriterTap()
                }}
                placeholder="Collaboration / Inquiry"
                className="w-full border-2 border-black bg-white px-3 py-2 font-inter text-xs text-black placeholder:text-black/30 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-mono text-[10px] font-bold tracking-wider uppercase text-black">
                  Your Letter *
                </label>
                <span className="font-mono text-[10px] text-black/50">
                  {message.length} / 500
                </span>
              </div>
              <textarea
                required
                maxLength={500}
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  playTypewriterTap()
                }}
                placeholder="Write your note here..."
                className="w-full border-2 border-black bg-white p-3 font-inter text-xs text-black placeholder:text-black/30 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-black/50 italic">
                Delivered via postal dispatch
              </span>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 border-2 border-black bg-black text-white font-mono text-xs font-bold tracking-wider uppercase hover:bg-white hover:text-black transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isPending ? 'Sealing...' : 'Drop in Mailbox →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
