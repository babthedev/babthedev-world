'use client'

import { useState, useEffect } from 'react'
import { MDXRemote } from 'next-mdx-remote'
import { useWorldStore } from '@/store/useWorldStore'
import { SPECIAL_DIALOGUES } from '@/lib/dialogue'
import { PANEL_SLIDE_MS } from '@/lib/constants'
import { useAudioManager } from '@/hooks/useAudioManager'

interface ContentResponse {
  found: boolean
  source?: any
  frontmatter?: Record<string, any>
  folder?: string
}

export default function ReadingPanel() {
  const activePanel = useWorldStore((s) => s.activePanel)
  const setActivePanel = useWorldStore((s) => s.setActivePanel)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const { playPageTurn } = useAudioManager()

  const [content, setContent] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const isOpen = activePanel !== null

  // ── FETCH CONTENT WHEN PANEL OPENS ──────────────────────
  useEffect(() => {
    if (!activePanel) {
      setContent(null)
      return
    }

    playPageTurn()
    setLoading(true)
    fetch(`/api/content/${activePanel}`)
      .then((res) => res.json())
      .then((data: ContentResponse) => {
        setContent(data)
        setLoading(false)
      })
      .catch(() => {
        setContent({ found: false })
        setLoading(false)
      })

    // Abdulrahman enters "Idle Waiting" — per spec, acknowledges reading state
    setCurrentDialogue(SPECIAL_DIALOGUES.reading_open.text)
  }, [activePanel, setCurrentDialogue])

  // ── CLOSE HANDLERS: X button, Escape, or click outside ──
  const closePanel = () => {
    playPageTurn()
    setActivePanel(null)
    setCurrentDialogue(SPECIAL_DIALOGUES.reading_close.text)
    setTimeout(() => setCurrentDialogue(null), 2500)
  }

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full md:w-[40%] z-30 bg-black border-l-2 border-white
        transform transition-transform ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ transitionDuration: `${PANEL_SLIDE_MS}ms` }}
    >
      {/* ── CLOSE BUTTON ─────────────────────────────────── */}
      <button
        onClick={closePanel}
        aria-label="Close panel"
        className="absolute top-6 right-6 w-11 h-11 border-2 border-black text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors z-10"

        >
        <span className="font-mono text-lg">✕</span>
      </button>

      {/* ── SCROLLABLE CONTENT ───────────────────────────── */}
      <div className="h-full overflow-y-auto px-8 py-20 md:px-12">
        {loading && (
          <p className="text-white/50 font-inter">Loading...</p>
        )}

        {!loading && content && !content.found && (
          <div>
            <h2 className="text-black font-merriweather text-3xl mb-4">
              [ CONTENT MISSING ]
            </h2>
            <p className="text-white/60 font-inter">
              This entry hasn&apos;t been written yet.
            </p>
          </div>
        )}

        {!loading && content?.found && (
          <article className="prose prose-invert max-w-none">
            {content.frontmatter?.title && (
              <h1 className="text-black font-merriweather text-4xl font-bold mb-2">
                {content.frontmatter.title}
              </h1>
            )}

            {content.frontmatter?.date && (
              <p className="text-white/40 font-mono text-xs uppercase tracking-wide mb-8">
                {content.frontmatter.date}
              </p>
            )}

            <div className="font-inter text-black/90 leading-relaxed [&_h1]:font-merriweather [&_h2]:font-merriweather [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-2 [&_code]:bg-[#141414] [&_code]:border [&_code]:border-white/20 [&_code]:px-1.5 [&_code]:py-0.5">
              <MDXRemote {...content.source} />
            </div>

            {content.frontmatter?.url && (
              <a
                href={content.frontmatter.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-8 border-2 border-black text-black px-6 py-3 font-inter hover:bg-white hover:text-black transition-colors"
              >
                VIEW LIVE ↗
              </a>
            )}
          </article>
        )}
      </div>
    </div>
  )
}