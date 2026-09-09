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
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-white border-2 border-black px-6 py-2.5">
  <span className="text-black font-inter text-sm tracking-[0.15em] uppercase">
    {label}
  </span>
</div>
    </div>
  )
}