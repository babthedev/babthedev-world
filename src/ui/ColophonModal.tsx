'use client'

import { useEffect, useCallback } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'

export default function ColophonModal() {
  const activePanel = useWorldStore((s) => s.activePanel)
  const setActivePanel = useWorldStore((s) => s.setActivePanel)
  const { playPageTurn } = useAudioManager()

  const isOpen = activePanel === 'colophon'

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Colophon and Credits"
    >
      <div
        className="relative w-full max-w-xl bg-[#FAF9F5] border-4 border-black p-6 md:p-8 text-[#111111] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close colophon"
          className="absolute top-5 right-5 w-8 h-8 border-2 border-black bg-white flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="font-mono text-sm leading-none">✕</span>
        </button>

        {/* Header */}
        <div className="mb-6 border-b-2 border-black pb-4 pr-10">
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-black/50 block mb-1">
            SPECIFICATION & ATTRIBUTIONS
          </span>
          <h2 className="font-merriweather text-2xl md:text-3xl font-bold text-black">
            Colophon & Credits
          </h2>
          <p className="font-inter text-xs text-black/70 mt-1">
            Technical architecture, open-source foundations, and design provenance.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 font-inter text-xs leading-relaxed text-black/85">
          {/* Spatial Architecture */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5 pb-1 border-b border-black/15">
              1. Spatial Sphere Architecture
            </h3>
            <p>
              BabWorld is modeled as an authentic <strong>50-meter diameter spherical planet</strong> (R = 25m)
              rendered with <strong>Three.js</strong>, <strong>React Three Fiber</strong>, and
              <strong>Rapier WASM Physics</strong>. Radial gravity forces (35 m/s²) accelerate characters
              toward (0, 0, 0), with camera and locomotion math calculated on dynamic tangent planes.
            </p>
          </div>

          {/* Shaders & Post-Processing */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5 pb-1 border-b border-black/15">
              2. Shaders & Visual Engine
            </h3>
            <p>
              Visual style is inspired by <em>Messenger</em> by Abeto and Italian town layouts.
              The monochrome ink look uses custom multi-step Cel shading, a custom normal-aware Sobel outline pass,
              procedural paper grain noise, and an SVG fractal ink iris transition.
            </p>
          </div>

          {/* Open-Source Attributions */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5 pb-1 border-b border-black/15">
              3. Open-Source Attributions
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Kenney.nl:</strong> Urban street furniture and architectural low-poly models (CC0 Public Domain).
              </li>
              <li>
                <strong>Pixiv VRM:</strong> Humanoid avatar character model specification (`@pixiv/three-vrm`).
              </li>
              <li>
                <strong>Web Audio API:</strong> 100% procedural synthesized marimba voice chirps, footsteps, and electrical hums (0KB audio download footprint).
              </li>
              <li>
                <strong>Next.js 16 & React 19:</strong> Fast static site generation, Turbopack, and edge caching.
              </li>
            </ul>
          </div>

          {/* Typography */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5 pb-1 border-b border-black/15">
              4. Typography
            </h3>
            <p>
              Type set in <strong>Inter</strong> (Architectural Sans for navigation, signage, and HUD) and
              <strong>Merriweather</strong> (Literary Serif for long-form essays, books, and case studies).
            </p>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5 pb-1 border-b border-black/15">
              5. Privacy & Zero-CDN Mandate
            </h3>
            <p>
              Zero tracking cookies, zero IP logging, and 100% self-hosted assets with no third-party CDNs.
            </p>
          </div>

          {/* Read as text */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5 pb-1 border-b border-black/15">
              6. Without the 3D world
            </h3>
            <p>
              Everything here is also{' '}
              <a href="/reader" className="underline decoration-2 underline-offset-2 font-bold hover:bg-black hover:text-white">
                readable as plain text
              </a>
              , for slower devices, screen readers, or anyone who would rather just read.
            </p>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t-2 border-black flex items-center justify-between font-mono text-[10px] text-black/50">
            <span>© 2026 Abdulrahman (BabTheDev)</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  )
}
