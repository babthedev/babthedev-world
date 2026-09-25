'use client'

import { useWorldStore } from '@/store/useWorldStore'

export default function InteractHint() {
  const touchUi = useWorldStore((s) => s.touchUi)
  return (
    <div
      id="interact-hint"
      className={`fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-150 ${
        touchUi ? 'bottom-44' : 'bottom-24'
      }`}
      style={{ opacity: 0 }}
    >
      <div className="bg-white border-2 border-black text-black px-4 py-2 font-mono text-sm tracking-wide">
  {touchUi ? 'TAP TO INTERACT' : '[ E ] INTERACT'}
</div>
    </div>
  )
}