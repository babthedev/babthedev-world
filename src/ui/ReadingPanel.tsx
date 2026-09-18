'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { MDXRemote } from 'next-mdx-remote'
import { useWorldStore } from '@/store/useWorldStore'
import { SPECIAL_DIALOGUES } from '@/lib/dialogue'
import { PANEL_SLIDE_MS } from '@/lib/constants'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useTelemetry } from '@/hooks/useTelemetry'
import { CodeBlock, Blockquote, Callout, CaptionedImage } from './MdxComponents'

interface ContentResponse {
  found: boolean
  source?: any
  frontmatter?: Record<string, any>
  folder?: string
}

interface ChapterHeading {
  id: string
  text: string
}

export default function ReadingPanel() {
  const activePanel = useWorldStore((s) => s.activePanel)
  const setActivePanel = useWorldStore((s) => s.setActivePanel)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const { playPageTurn, playClick } = useAudioManager()
  const { trackEvent } = useTelemetry()

  const [content, setContent] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [zoomMedia, setZoomMedia] = useState<{ src: string; alt: string; caption?: string } | null>(null)
  const [headings, setHeadings] = useState<ChapterHeading[]>([])

  const isOpen = activePanel !== null

  // ── Q76: TELEMETRY TRACKING ON CONTENT OPEN & 2-MIN ENGAGEMENT ─
  useEffect(() => {
    if (!activePanel) return

    trackEvent('content_opened', { slug: activePanel })

    const twoMinTimer = setTimeout(() => {
      trackEvent('content_read_2min', { slug: activePanel })
    }, 120_000)

    return () => clearTimeout(twoMinTimer)
  }, [activePanel, trackEvent])

  // ── FETCH CONTENT WHEN PANEL OPENS ──────────────────────
  useEffect(() => {
    if (!activePanel) {
      setContent(null)
      setHeadings([])
      setZoomMedia(null)
      return
    }

    playPageTurn()
    setLoading(true)
    fetch(`/api/content/${activePanel}`)
      .then((res) => res.json())
      .then((data: ContentResponse) => {
        setContent(data)
        setLoading(false)

        // Parse h2 headings from source compiled text or frontmatter
        if (data.source?.compiledSource) {
          const matches = [...data.source.compiledSource.matchAll(/"h2",\{[^}]*\},"([^"]+)"/g)]
          if (matches.length > 0) {
            const list = matches.map((m) => {
              const text = m[1]
              const id = text.toLowerCase().replace(/[^\w]+/g, '-')
              return { id, text }
            })
            setHeadings(list)
          } else {
            setHeadings([])
          }
        }
      })
      .catch(() => {
        setContent({ found: false })
        setLoading(false)
        setHeadings([])
      })

    // Abdulrahman enters "Idle Waiting" — acknowledges reading state
    setCurrentDialogue(SPECIAL_DIALOGUES.reading_open.text)
  }, [activePanel, setCurrentDialogue, playPageTurn])

  // ── CLOSE HANDLERS: X button, Escape, or click outside ──
  const closePanel = useCallback(() => {
    playPageTurn()
    setActivePanel(null)
    setZoomMedia(null)
    setCurrentDialogue(SPECIAL_DIALOGUES.reading_close.text)
    setTimeout(() => setCurrentDialogue(null), 2500)
  }, [setActivePanel, setCurrentDialogue, playPageTurn])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        if (zoomMedia) {
          setZoomMedia(null)
        } else {
          closePanel()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, zoomMedia, closePanel])

  const scrollToHeading = (id: string) => {
    playClick()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Custom MDX component mappings (Q72)
  const mdxComponents = useMemo(
    () => ({
      pre: CodeBlock,
      blockquote: Blockquote,
      Callout,
      img: (props: any) => (
        <CaptionedImage
          {...props}
          onZoom={(src, alt, caption) => setZoomMedia({ src, alt, caption })}
        />
      ),
      h2: ({ children }: any) => {
        const text = typeof children === 'string' ? children : String(children ?? '')
        const id = text.toLowerCase().replace(/[^\w]+/g, '-')
        return (
          <h2
            id={id}
            className="font-merriweather text-2xl font-bold mt-10 mb-4 pb-2 border-b border-black/15 text-[#111111] scroll-mt-20"
          >
            {children}
          </h2>
        )
      },
    }),
    []
  )

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[45%] lg:w-[38%] z-30 bg-[#FAF9F5] border-l-2 border-black
          transform transition-transform ease-in-out shadow-[-8px_0px_24px_rgba(0,0,0,0.12)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionDuration: `${PANEL_SLIDE_MS}ms` }}
        role="dialog"
        aria-label="Reading Panel"
      >
        {/* ── CLOSE BUTTON ─────────────────────────────────── */}
        <button
          onClick={closePanel}
          aria-label="Close reading panel"
          className="absolute top-6 right-6 w-10 h-10 border-2 border-black bg-[#FAF9F5] text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors z-20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="font-mono text-base">✕</span>
        </button>

        {/* ── Q73: STICKY CHAPTER OUTLINE ──────────────────── */}
        {headings.length > 1 && (
          <div className="sticky top-0 z-10 bg-[#FAF9F5]/95 backdrop-blur-sm border-b border-black/15 px-8 py-3.5 pr-20 flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
            <span className="text-[10px] font-mono font-bold tracking-widest text-black/50 uppercase whitespace-nowrap mr-1">
              INDEX:
            </span>
            {headings.map((h, i) => (
              <button
                key={h.id}
                onClick={() => scrollToHeading(h.id)}
                className="text-[11px] font-mono px-2.5 py-1 border border-black/30 hover:border-black hover:bg-black hover:text-white text-black/80 transition-colors whitespace-nowrap"
              >
                {i + 1}. {h.text}
              </button>
            ))}
          </div>
        )}

        {/* ── SCROLLABLE ARTICLE CONTENT ───────────────────── */}
        <div className="h-full overflow-y-auto px-8 py-16 md:px-12 pb-32">
          {loading && (
            <div className="py-20 text-center">
              <p className="text-black/50 font-mono text-xs tracking-widest uppercase animate-pulse">
                RETRIEVING ARCHIVAL RECORD...
              </p>
            </div>
          )}

          {!loading && content && !content.found && (
            <div className="py-20">
              <h2 className="text-black font-merriweather text-3xl font-bold mb-4">
                [ CONTENT MISSING ]
              </h2>
              <p className="text-black/60 font-inter">
                This entry has not been published yet.
              </p>
            </div>
          )}

          {!loading && content?.found && (
            <article className="max-w-none text-[#111111]">
              {/* ── Q78: 1-CLICK RESUME PDF DOWNLOAD ───────────────── */}
              {activePanel === 'resume' && (
                <div className="mb-8 p-4 border-2 border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                      OFFICIAL CURRICULUM VITAE
                    </p>
                    <p className="font-inter text-xs text-black/60">
                      ATS-friendly printable PDF (1-page)
                    </p>
                  </div>
                  <a
                    href="/resume.pdf"
                    download="Abdulrahman_Resume.pdf"
                    onClick={() => playClick()}
                    className="inline-flex items-center justify-center gap-2 border-2 border-black bg-black text-white px-4 py-2 font-mono text-xs font-bold tracking-wider uppercase hover:bg-white hover:text-black transition-colors shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span>DOWNLOAD PDF</span>
                    <span>↓</span>
                  </a>
                </div>
              )}

              {content.frontmatter?.title && (
                <h1 className="text-black font-merriweather text-3xl md:text-4xl font-black tracking-tight mb-2">
                  {content.frontmatter.title}
                </h1>
              )}

              {content.frontmatter?.date && (
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-black/50 mb-8 pb-4 border-b border-black/10">
                  <span>{content.frontmatter.date}</span>
                  {content.frontmatter.category && (
                    <>
                      <span>•</span>
                      <span>{content.frontmatter.category}</span>
                    </>
                  )}
                </div>
              )}

              <div className="font-inter text-black/90 leading-relaxed text-[15px] [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-5 [&_li]:mb-1.5 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-2 [&_a]:font-medium [&_strong]:text-black [&_strong]:font-semibold">
                <MDXRemote {...content.source} components={mdxComponents} />
              </div>

              {content.frontmatter?.url && (
                <div className="mt-12 pt-6 border-t-2 border-black">
                  <a
                    href={content.frontmatter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border-2 border-black bg-black text-white px-6 py-3 font-mono text-xs tracking-wider uppercase hover:bg-transparent hover:text-black transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span>VISIT PROJECT REPOSITORY</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </article>
          )}
        </div>
      </div>

      {/* ── Q74: FULLSCREEN MEDIA LIGHTBOX ─────────────────── */}
      {zoomMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 select-none"
          onClick={() => setZoomMedia(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setZoomMedia(null)}
            className="absolute top-6 right-6 w-11 h-11 border-2 border-white text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors z-10"
            aria-label="Close zoom"
          >
            <span className="font-mono text-lg">✕</span>
          </button>
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={zoomMedia.src}
              alt={zoomMedia.alt}
              className="max-w-full max-h-[75vh] object-contain border-2 border-white/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {(zoomMedia.caption || zoomMedia.alt) && (
              <p
                className="mt-4 text-xs font-mono text-white/80 text-center tracking-wider max-w-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {zoomMedia.caption || zoomMedia.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}