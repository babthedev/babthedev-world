'use client'

import { useEffect, useRef } from 'react'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useWorldStore } from '@/store/useWorldStore'
import MapCanvas, { MAP_DISTRICTS } from '@/ui/MapCanvas'
import type { DistrictName } from '@/lib/worldCoordinates'

/**
 * The full world map: the whole town on one page, Hub in the middle, the Library
 * street pointing up. Tap a district, on the map or in the list, and an ink wipe
 * carries you there.
 */
export default function WorldMap() {
  const mapOpen = useWorldStore((s) => s.mapOpen)
  const setMapOpen = useWorldStore((s) => s.setMapOpen)
  const requestTravel = useWorldStore((s) => s.requestTravel)
  const visited = useWorldStore((s) => s.visitedDistricts)
  const current = useWorldStore((s) => s.currentDistrict)
  const touchUi = useWorldStore((s) => s.touchUi)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { playWhoosh } = useAudioManager()
  const wasOpen = useRef(false)

  // rising as it opens, falling as it closes; silent on first render
  useEffect(() => {
    if (mapOpen !== wasOpen.current) playWhoosh(mapOpen)
    wasOpen.current = mapOpen
  }, [mapOpen, playWhoosh])

  useEffect(() => {
    if (!mapOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setMapOpen(false)
    }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [mapOpen, setMapOpen])

  if (!mapOpen) return null

  const go = (path: DistrictName) => requestTravel(path)

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/75 p-3 md:p-6"
      onClick={() => setMapOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="World map"
        className="flex w-full max-w-[640px] flex-col border-2 border-[#0B0B0B] bg-[#F3F2ED] shadow-[6px_6px_0_0_#0B0B0B]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#0B0B0B] px-4 py-2 font-mono text-sm font-bold tracking-widest text-[#F3F2ED]">
          <span>WORLD MAP</span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setMapOpen(false)}
            aria-label="Close map"
            className="flex h-9 w-9 items-center justify-center border-2 border-[#F3F2ED] text-base hover:bg-[#F3F2ED] hover:text-[#0B0B0B]"
          >
            ✕
          </button>
        </div>

        <div className="p-3 md:p-4">
          <MapCanvas
            variant="world"
            onPickDistrict={go}
            className="mx-auto block aspect-square w-[min(100%,58vh)] cursor-pointer rounded-full border-2 border-[#0B0B0B] bg-[#D9D7D0]"
          />
          <p className="mt-3 text-center font-mono text-[11px] tracking-widest text-[#0B0B0B]/60">
            {touchUi ? 'TAP A DISTRICT TO TRAVEL' : 'CLICK A DISTRICT TO TRAVEL  ·  M OR ESC TO CLOSE'}
          </p>

          <ul className="mt-3 grid grid-cols-2 gap-2">
            {MAP_DISTRICTS.map((d) => {
              const here = current === d.path
              return (
                <li key={d.path}>
                  <button
                    type="button"
                    onClick={() => go(d.path)}
                    className="flex min-h-11 w-full items-center justify-between border-2 border-[#0B0B0B] px-3 py-2 text-left font-inter text-sm hover:bg-[#0B0B0B] hover:text-[#F3F2ED]"
                  >
                    <span>{d.name}</span>
                    <span className="font-mono text-xs">{here ? '● HERE' : visited.includes(d.path) ? '✓' : '→'}</span>
                  </button>
                </li>
              )
            })}
            <li className="col-span-2">
              <div className="flex min-h-11 items-center justify-between border-2 border-dashed border-[#0B0B0B]/30 px-3 py-2 font-inter text-sm text-[#0B0B0B]/40">
                <span>Oryzon</span>
                <span className="font-mono text-xs">COMING SOON</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
