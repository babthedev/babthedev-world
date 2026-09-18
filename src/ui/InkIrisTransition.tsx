'use client'

import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/useWorldStore'

/**
 * Q70: Scene Transitions → CIRCULAR INK-DROP IRIS WIPE
 *
 * Fullscreen circular iris wipe simulating organic ink diffusing on porous
 * cotton paper using SVG fractal noise displacement.
 */
export default function InkIrisTransition() {
  const irisPhase = useWorldStore((s) => s.irisPhase)
  const [radiusPercent, setRadiusPercent] = useState(100)

  useEffect(() => {
    if (irisPhase === 'idle') {
      setRadiusPercent(100)
      return
    }

    if (irisPhase === 'closing') {
      // Rapid closing to center
      setRadiusPercent(100)
      const start = performance.now()
      const duration = 300 // ms
      let frameId: number

      const animateClose = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(1, elapsed / duration)
        // Ease-in curve for natural fluid deceleration
        const current = (1 - progress * progress) * 100
        setRadiusPercent(current)

        if (progress < 1) {
          frameId = requestAnimationFrame(animateClose)
        }
      }

      frameId = requestAnimationFrame(animateClose)
      return () => cancelAnimationFrame(frameId)
    }

    if (irisPhase === 'opening') {
      // Smooth bloom open
      setRadiusPercent(0)
      const start = performance.now()
      const duration = 340 // ms
      let frameId: number

      const animateOpen = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(1, elapsed / duration)
        // Ease-out cubic curve
        const t = progress - 1
        const eased = t * t * t + 1
        setRadiusPercent(eased * 100)

        if (progress < 1) {
          frameId = requestAnimationFrame(animateOpen)
        }
      }

      frameId = requestAnimationFrame(animateOpen)
      return () => cancelAnimationFrame(frameId)
    }
  }, [irisPhase])

  if (irisPhase === 'idle') return null

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Organic ink bleeding filter */}
          <filter id="ink-bleed-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <mask id="iris-mask">
            {/* White reveals the solid black overlay */}
            <rect width="100" height="100" fill="white" />
            {/* Black circle punches the viewport window out */}
            <circle
              cx="50"
              cy="50"
              r={radiusPercent * 0.75}
              fill="black"
              filter="url(#ink-bleed-filter)"
            />
          </mask>
        </defs>

        {/* Solid ink overlay masked by the expanding/contracting iris */}
        <rect
          width="100"
          height="100"
          fill="#111111"
          mask="url(#iris-mask)"
        />
      </svg>
    </div>
  )
}
