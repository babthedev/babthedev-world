'use client'

import { useEffect, useState } from 'react'
import { Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { cartesianToPolar, PLANET_RADIUS } from '@/lib/sphereMath'

export default function DebugOverlay() {
  const debugMode = useWorldStore((s) => s.debugMode)
  const freeFlyMode = useWorldStore((s) => s.freeFlyMode)
  const toggleDebugMode = useWorldStore((s) => s.toggleDebugMode)
  const toggleFreeFlyMode = useWorldStore((s) => s.toggleFreeFlyMode)
  const setDebugMode = useWorldStore((s) => s.setDebugMode)
  const position = useWorldStore((s) => s.position)
  const currentDistrict = useWorldStore((s) => s.currentDistrict)
  const isTourActive = useWorldStore((s) => s.isTourActive)

  const [fps, setFps] = useState(60)

  // Listen for F3 and G shortcut keys, and check URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === 'true') {
      setDebugMode(true)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // F3: toggle debug overlay & wireframes
      if (e.code === 'F3') {
        e.preventDefault()
        toggleDebugMode()
      }
      // G: toggle free-fly orbit camera when debug mode is open
      if (e.code === 'KeyG' && (debugMode || e.altKey)) {
        e.preventDefault()
        toggleFreeFlyMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [debugMode, setDebugMode, toggleDebugMode, toggleFreeFlyMode])

  // Simple FPS sample
  useEffect(() => {
    if (!debugMode) return
    let frameCount = 0
    let lastTime = performance.now()
    let handle: number

    const loop = (now: number) => {
      frameCount++
      if (now - lastTime >= 500) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)))
        frameCount = 0
        lastTime = now
      }
      handle = requestAnimationFrame(loop)
    }
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
  }, [debugMode])

  if (!debugMode) return null

  const posVec = new Vector3(...position)
  const { theta, phi, radius } = cartesianToPolar(posVec)
  const thetaDeg = Math.round((theta * 180) / Math.PI)
  const phiDeg = Math.round((phi * 180) / Math.PI)
  const surfaceArcDist = (phi * PLANET_RADIUS).toFixed(2)

  return (
    <div className="fixed top-4 left-4 z-50 pointer-events-auto bg-black/90 text-white font-mono text-xs border border-white/40 p-4 rounded shadow-2xl max-w-xs space-y-2.5 backdrop-blur select-none">
      <div className="flex items-center justify-between border-b border-white/20 pb-1.5 font-bold tracking-wider">
        <span>[F3] DEV INSPECTOR</span>
        <span className="text-emerald-400">{fps} FPS</span>
      </div>

      <div className="space-y-1 text-white/80">
        <div className="flex justify-between">
          <span className="text-white/50">District:</span>
          <span className="font-semibold text-white">{currentDistrict}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Tour:</span>
          <span>{isTourActive ? 'ACTIVE' : 'FREE-ROAM'}</span>
        </div>
      </div>

      <div className="border-t border-white/15 pt-1.5 space-y-1 text-white/80">
        <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
          Cartesian (XYZ)
        </div>
        <div className="grid grid-cols-3 gap-1 text-center font-mono">
          <div className="bg-white/5 py-0.5 rounded">X: {position[0].toFixed(1)}</div>
          <div className="bg-white/5 py-0.5 rounded">Y: {position[1].toFixed(1)}</div>
          <div className="bg-white/5 py-0.5 rounded">Z: {position[2].toFixed(1)}</div>
        </div>
      </div>

      <div className="border-t border-white/15 pt-1.5 space-y-1 text-white/80">
        <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
          Spherical Coordinates
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Azimuth (θ):</span>
          <span>{thetaDeg}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Inclination (φ):</span>
          <span>{phiDeg}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Radius:</span>
          <span>{radius.toFixed(2)}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Arc from Pole:</span>
          <span>{surfaceArcDist}m</span>
        </div>
      </div>

      <div className="border-t border-white/15 pt-2 flex flex-col gap-1.5">
        <button
          onClick={toggleFreeFlyMode}
          className={`w-full py-1 px-2 border text-center transition-colors text-[11px] uppercase tracking-wide ${
            freeFlyMode
              ? 'bg-white text-black border-white font-bold'
              : 'border-white/30 text-white/80 hover:bg-white/10'
          }`}
        >
          {freeFlyMode ? 'Free-Fly: ENABLED [G]' : 'Free-Fly: DISABLED [G]'}
        </button>

        <button
          onClick={toggleDebugMode}
          className="w-full py-0.5 text-center text-[10px] text-white/40 hover:text-white transition-colors"
        >
          Close Inspector [F3]
        </button>
      </div>
    </div>
  )
}
