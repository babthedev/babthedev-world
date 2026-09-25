'use client'

import { useWorldStore } from '@/store/useWorldStore'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'

/**
 * District title card. Big blocky type in the bottom-left, the way Messenger
 * announces a place: paper-white fill, thick ink outline, hard offset shadow.
 * Sits above the compass. Slides in on arrival and out again after a few seconds.
 */
export default function DistrictLabel() {
  const visible = useWorldStore((s) => s.districtLabelVisible)
  const currentDistrict = useWorldStore((s) => s.currentDistrict)

  const label = WORLD_COORDINATES[currentDistrict as DistrictName]?.label ?? ''
  // One word per line so long names stack into a compact block instead of a wide banner
  const words = label.split(' ')

  return (
    <div
      id="district-label"
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 left-4 z-30 pointer-events-none select-none md:bottom-24 md:left-8
        transition-all duration-500 ease-out motion-reduce:transition-none ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}
    >
      <span className="sr-only">District: {label}</span>
      <div
        aria-hidden="true"
        className="font-inter font-black uppercase leading-[0.88] tracking-tight text-[#F3F2ED] text-[clamp(2.4rem,6.5vw,5.5rem)]"
        style={{
          WebkitTextStroke: '0.09em #111',
          paintOrder: 'stroke fill',
          textShadow: '0.06em 0.06em 0 #111',
        }}
      >
        {words.map((w, i) => (
          <span key={i} className="block">
            {w}
          </span>
        ))}
      </div>
    </div>
  )
}
