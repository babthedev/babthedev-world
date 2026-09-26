'use client'

import { useEffect } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import MapCanvas from '@/ui/MapCanvas'

/**
 * The corner minimap: a round, heading-up view of the streets around the visitor.
 * Tap it (or press M) to open the full world map. Bottom-left on desktop; top-left
 * on touch devices, where the bottom-left belongs to the joystick.
 */
export default function Minimap() {
  const introComplete = useWorldStore((s) => s.introComplete)
  const touchUi = useWorldStore((s) => s.touchUi)
  const mapOpen = useWorldStore((s) => s.mapOpen)
  const setMapOpen = useWorldStore((s) => s.setMapOpen)

  // M toggles the map, unless the visitor is typing into a form
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyM' || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const s = useWorldStore.getState()
      if (!s.introComplete) return
      s.setMapOpen(!s.mapOpen)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const visible = introComplete && !mapOpen

  return (
    <button
      type="button"
      onClick={() => setMapOpen(true)}
      aria-label="Open world map"
      title="World map (M)"
      tabIndex={visible ? 0 : -1}
      className={`group fixed z-20 cursor-pointer origin-top-left transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
        touchUi ? 'left-3' : 'bottom-4 left-4 md:bottom-6 md:left-6'
      } ${visible ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-90'}`}
      style={touchUi ? { top: 'calc(12px + env(safe-area-inset-top, 0px))' } : undefined}
    >
      <MapCanvas
        variant="compact"
        className="block h-[156px] w-[156px] rounded-full border-2 border-[#0B0B0B] bg-[#D9D7D0] shadow-[3px_3px_0_0_#0B0B0B] transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-0 md:h-[208px] md:w-[208px]"
      />
      {/* Affordance: says it opens, and which key does it */}
      <span
        aria-hidden
        className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center border-2 border-[#0B0B0B] bg-[#F3F2ED] px-1 font-mono text-[11px] font-bold leading-none text-[#0B0B0B]"
      >
        {touchUi ? '⤢' : 'M'}
      </span>
    </button>
  )
}
