'use client'

import { useWorldStore } from '@/store/useWorldStore'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'

export default function DistrictLabel() {
  const visible = useWorldStore((s) => s.districtLabelVisible)
  const currentDistrict = useWorldStore((s) => s.currentDistrict)

  const label =
    WORLD_COORDINATES[currentDistrict as DistrictName]?.label ?? ''

  return (
    <div
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
      <div className="bg-white border-2 border-black px-8 py-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center select-none">
        <span className="text-black font-inter text-xs md:text-sm font-bold tracking-[0.2em] uppercase block">
          {label}
        </span>
        <span className="text-black/40 font-mono text-[9px] tracking-widest uppercase block mt-0.5">
          District Boundary
        </span>
      </div>
    </div>
  )
}