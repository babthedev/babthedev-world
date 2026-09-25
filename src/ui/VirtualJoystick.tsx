'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { stickFromOffset, touchInput, type StickReading } from '@/lib/touchInput'

const BASE = 132 // px, outer ring
const KNOB = 58 // px
const TRAVEL = (BASE - KNOB) / 2 + 6 // how far the thumb may move from the centre

const isMovementKey = (code: string) =>
  code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD' || code.startsWith('Arrow')

/**
 * Decides whether touch is the visitor's input right now. A phone or tablet
 * (coarse primary pointer) starts in touch mode. A touch-screen laptop starts in
 * desktop mode and switches to touch the moment a finger lands, then back to
 * desktop on a mouse click or a movement key.
 */
function useTouchMode() {
  const setTouchUi = useWorldStore((s) => s.setTouchUi)
  useEffect(() => {
    const coarse = () => window.matchMedia?.('(pointer: coarse)').matches ?? false
    setTouchUi(coarse())
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') setTouchUi(true)
      else if (e.pointerType === 'mouse') setTouchUi(coarse())
    }
    const onKey = (e: KeyboardEvent) => {
      if (isMovementKey(e.code)) setTouchUi(coarse())
    }
    window.addEventListener('pointerdown', onPointer, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [setTouchUi])
}

/**
 * Thumb-stick for touch devices, bottom-left. Drag to walk; the visitor moves
 * relative to the camera, exactly like W A S D. Appears only in touch mode, once
 * the intro is over, and steps aside while a panel is being read.
 */
export default function VirtualJoystick() {
  useTouchMode()
  const touchUi = useWorldStore((s) => s.touchUi)
  const introComplete = useWorldStore((s) => s.introComplete)
  const isReading = useWorldStore((s) => s.isReading)
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)
  const reading = useRef<StickReading>({ x: 0, y: 0, active: false })

  const release = useCallback(() => {
    pointerId.current = null
    touchInput.x = 0
    touchInput.y = 0
    touchInput.active = false
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)'
  }, [])

  const drive = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current
    if (!base) return
    const rect = base.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    const r = stickFromOffset(dx, dy, TRAVEL, reading.current)
    touchInput.x = r.x
    touchInput.y = r.y
    touchInput.active = r.active
    // Knob follows the thumb but stays inside the ring
    const len = Math.hypot(dx, dy)
    const k = len > TRAVEL ? TRAVEL / len : 1
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx * k}px, ${dy * k}px)`
  }, [])

  // Never leave the visitor walking if the stick disappears mid-touch
  const visible = touchUi && introComplete && !isReading
  useEffect(() => {
    if (!visible) release()
  }, [visible, release])
  useEffect(() => release, [release])

  return (
    <div
      ref={baseRef}
      role="group"
      aria-label="Movement joystick"
      data-joystick
      onPointerDown={(e) => {
        if (pointerId.current !== null) return
        pointerId.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        drive(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (e.pointerId === pointerId.current) drive(e.clientX, e.clientY)
      }}
      onPointerUp={(e) => {
        if (e.pointerId === pointerId.current) release()
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === pointerId.current) release()
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`fixed left-5 z-30 select-none rounded-full border-2 border-[#0B0B0B] bg-[#F3F2ED]/80 shadow-[3px_3px_0_0_#0B0B0B] transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        width: BASE,
        height: BASE,
        bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {/* Direction ticks */}
      {[0, 90, 180, 270].map((deg) => (
        <span
          key={deg}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ transform: `rotate(${deg}deg) translateY(-${BASE / 2 - 12}px)` }}
        >
          <span className="absolute -left-[4px] block h-0 w-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-[#0B0B0B]/60" />
        </span>
      ))}
      <div
        ref={knobRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 border-[#0B0B0B] bg-[#0B0B0B]"
        style={{ width: KNOB, height: KNOB, marginLeft: -KNOB / 2, marginTop: -KNOB / 2 }}
      >
        <div className="absolute inset-[5px] rounded-full border border-[#F3F2ED]/50" />
      </div>
    </div>
  )
}
