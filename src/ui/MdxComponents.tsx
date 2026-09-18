'use client'

import { useState, useCallback } from 'react'

/**
 * Q72: Curated Monochrome MDX Components
 * - 1-click code copy button with tactile visual feedback
 * - Editorial pull quotes with stark brutalist borders
 * - Hand-drawn / brutalist callout boxes
 * - Captioned image with full-screen zoom lightbox (Q74)
 */

export function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    // Extract plain text from code children
    const codeElement = (children as any)?.props?.children
    const textToCopy =
      typeof codeElement === 'string'
        ? codeElement
        : Array.isArray(codeElement)
        ? codeElement.join('')
        : ''

    if (textToCopy && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }, [children])

  return (
    <div className="relative my-6 group border border-black/20 bg-[#141414] text-[#EDEDED] font-mono text-xs overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1F1F1F] border-b border-black/30 select-none">
        <span className="text-[10px] tracking-wider text-white/50 uppercase font-mono">
          CODE
        </span>
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="px-2 py-0.5 text-[10px] font-mono border border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition-colors uppercase"
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed" {...props}>
        {children}
      </pre>
    </div>
  )
}

export function Blockquote({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className="my-6 border-l-4 border-black pl-5 py-1 font-merriweather italic text-lg text-black/85 leading-relaxed bg-black/[0.02]"
      {...props}
    >
      {children}
    </blockquote>
  )
}

export function Callout({
  children,
  title = 'NOTE',
  type = 'note',
}: {
  children: React.ReactNode
  title?: string
  type?: 'note' | 'warning' | 'tip'
}) {
  return (
    <div className="my-6 border-2 border-black p-5 bg-[#FAF9F5] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="font-mono text-xs font-bold uppercase tracking-wider mb-2 text-black flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-black" />
        {title}
      </div>
      <div className="text-sm font-inter text-black/85 leading-relaxed [&>p]:mb-0">
        {children}
      </div>
    </div>
  )
}

export function CaptionedImage({
  src,
  alt = '',
  caption,
  onZoom,
}: {
  src?: string
  alt?: string
  caption?: string
  onZoom?: (src: string, alt: string, caption?: string) => void
}) {
  if (!src) return null

  return (
    <figure className="my-6">
      <div
        onClick={() => onZoom?.(src, alt, caption)}
        className="cursor-zoom-in border border-black/30 overflow-hidden bg-black/5 hover:border-black transition-colors"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain max-h-[480px] hover:scale-[1.01] transition-transform duration-200"
          loading="lazy"
        />
      </div>
      {(caption || alt) && (
        <figcaption className="mt-2 text-xs font-mono text-black/60 text-center tracking-wide">
          ↑ {caption || alt}
        </figcaption>
      )}
    </figure>
  )
}
