'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWorldStore } from '@/store/useWorldStore'
import { useNearbyProps } from '@/hooks/useNearbyProps'
import { PropLocation } from '@/lib/worldCoordinates'

// Logic-only component — MUST be rendered INSIDE <Canvas> (uses useFrame)
// Renders nothing itself. Writes directly to a DOM node outside Canvas
// via a ref lookup, avoiding React re-renders on every frame.
export default function InteractiveProps() {
  const position = useWorldStore((s) => s.position)
  const isReading = useWorldStore((s) => s.isReading)
  const setActivePanel = useWorldStore((s) => s.setActivePanel)
  const setNearbyPropId = useWorldStore((s) => s.setNearbyPropId)

  const { findNearestProp } = useNearbyProps()
  const nearestPropRef = useRef<PropLocation | null>(null)

  useFrame(() => {
    if (isReading) {
      if (nearestPropRef.current !== null) {
        nearestPropRef.current = null
        setNearbyPropId(null)
      }
      const hint = document.getElementById('interact-hint')
      if (hint) hint.style.opacity = '0'
      return
    }

    const nearest = findNearestProp(position)
    const prevId = nearestPropRef.current?.panelId ?? null
    const newId = nearest?.panelId ?? null

    if (prevId !== newId) {
      nearestPropRef.current = nearest
      setNearbyPropId(newId)
    }

    const hint = document.getElementById('interact-hint')
    if (hint) hint.style.opacity = nearest ? '1' : '0'
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'KeyE' && e.code !== 'Enter') return
      const prop = nearestPropRef.current
      if (prop && prop.panelId) {
        setActivePanel(prop.panelId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActivePanel])

  return null
}