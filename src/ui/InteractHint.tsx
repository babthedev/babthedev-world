'use client'

export default function InteractHint() {
  return (
    <div
      id="interact-hint"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-150"
      style={{ opacity: 0 }}
    >
      <div className="bg-white border-2 border-black text-black px-4 py-2 font-mono text-sm tracking-wide">
  [ E ] INTERACT
</div>
    </div>
  )
}