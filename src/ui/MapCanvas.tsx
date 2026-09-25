'use client'

import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { cameraRig } from '@/lib/cameraRig'
import { PLANET_RADIUS } from '@/lib/constants'
import { settleFacing } from '@/lib/sphereMath'
import { projectToMap, type MapPoint } from '@/lib/minimap'
import { BUILDINGS, PLAZAS, STREETS, flatToUnit } from '@/lib/streetLayout'
import { WORLD_COORDINATES, type DistrictName } from '@/lib/worldCoordinates'

const INK = '#0B0B0B'
const PAPER = '#F3F2ED'
const GROUND = '#D9D7D0'
const BLOCK = '#1B1B1B'

const ROAD_WIDTH = 6
const FRAME_MS = 1000 / 24

/** Compact map: centred on the visitor, heading-up, this many metres to the rim */
export const COMPACT_VIEW_RADIUS = 42
/** World map: centred on the Hub, Library-up, this many metres to the rim */
export const WORLD_VIEW_RADIUS = 52

export const MAP_DISTRICTS: { path: DistrictName; label: string; name: string }[] = [
  { path: '/', label: 'HUB', name: 'The Hub' },
  { path: '/projects', label: 'PROJECTS', name: 'Projects Exhibition' },
  { path: '/essays', label: 'LIBRARY', name: 'The Library' },
  { path: '/bio', label: 'TERRACE', name: 'Welcome Terrace' },
]

const _p = new Vector3()
const _c = new Vector3()
const _h = new Vector3()
const _face = new Vector3()
const _q = new Vector3()
const _ahead = new Vector3()
const _pt: MapPoint = { x: 0, y: 0, dist: 0 }
const _pt2: MapPoint = { x: 0, y: 0, dist: 0 }

// Static map data, built once
let districtUnits: { path: DistrictName; label: string; unit: Vector3 }[] | null = null
const getDistrictUnits = () =>
  (districtUnits ??= MAP_DISTRICTS.map((d) => {
    const [x, , z] = WORLD_COORDINATES[d.path].sensorPoint
    return { path: d.path, label: d.label, unit: flatToUnit(x, z) }
  }))

let worldFrame: { centre: Vector3; heading: Vector3 } | null = null
/** Fixed frame for the world map: the Hub in the middle, the Library street pointing up. */
function getWorldFrame() {
  if (!worldFrame) {
    const centre = flatToUnit(0, 0)
    const library = flatToUnit(0, -40)
    const heading = library.clone().addScaledVector(centre, -library.dot(centre)).normalize()
    worldFrame = { centre, heading }
  }
  return worldFrame
}

interface MapCanvasProps {
  variant: 'compact' | 'world'
  className?: string
  /** World variant: called when a district marker is tapped */
  onPickDistrict?: (path: DistrictName) => void
}

/**
 * The map drawing, shared by the corner minimap and the full world map. Streets are
 * light lanes between dark building blocks; diamonds are districts (filled once
 * visited), the ringed dot is Abdulrahman, the arrow is you. The projection is
 * azimuthal-equidistant (see lib/minimap.ts), so distances on the small sphere are true.
 */
export default function MapCanvas({ variant, className, onPickDistrict }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Where each district was last drawn, in CSS pixels, for tap hit-testing
  const hitTargets = useRef<{ path: DistrictName; x: number; y: number }[]>([])
  const world = variant === 'world'

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let raf = 0
    let last = 0
    let size = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = Math.round(canvas.clientWidth * dpr)
      if (size > 0 && (canvas.width !== size || canvas.height !== size)) {
        canvas.width = size
        canvas.height = size
      }
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = () => {
      if (size <= 0) return
      const dpr = size / canvas.clientWidth
      const state = useWorldStore.getState()
      const cx = size / 2
      const cy = size / 2
      const radiusPx = size / 2
      const viewRadius = world ? WORLD_VIEW_RADIUS : COMPACT_VIEW_RADIUS
      const k = (radiusPx - 3 * dpr) / viewRadius // pixels per metre
      // Marker and type scale: the world map is drawn large, so its marks are too
      const u = world ? Math.min(2.4, Math.max(1.3, size / dpr / 300)) : 1

      // The visitor, always
      _p.set(state.position[0], state.position[1], state.position[2]).normalize()
      _face.set(state.facingDir[0], state.facingDir[1], state.facingDir[2])
      settleFacing(_p, _face)

      // The frame the map is drawn in
      if (world) {
        const f = getWorldFrame()
        _c.copy(f.centre)
        _h.copy(f.heading)
      } else {
        _c.copy(_p)
        _h.copy(cameraRig.heading)
        settleFacing(_c, _h)
      }

      const sx = (pt: MapPoint) => cx + pt.x * k
      const sy = (pt: MapPoint) => cy - pt.y * k

      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = GROUND
      ctx.fillRect(0, 0, size, size)

      // ── Streets and plazas: an ink outline pass, then a paper fill pass, so
      // junctions merge into one clean shape
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const outline = (world ? 4 : 3) * dpr
      const strokeStreets = (width: number, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        for (const street of STREETS) {
          ctx.beginPath()
          let pen = false
          for (const smp of street.samples) {
            projectToMap(_c, _h, smp.p, _pt)
            if (_pt.dist > viewRadius * 1.5) {
              pen = false
              continue
            }
            if (pen) ctx.lineTo(sx(_pt), sy(_pt))
            else ctx.moveTo(sx(_pt), sy(_pt))
            pen = true
          }
          if (street.closed && pen) ctx.closePath()
          ctx.stroke()
        }
      }
      const fillPlazas = (grow: number, color: string) => {
        ctx.fillStyle = color
        for (const plaza of PLAZAS) {
          projectToMap(_c, _h, plaza.center, _pt)
          if (_pt.dist > viewRadius + plaza.radius) continue
          ctx.beginPath()
          ctx.arc(sx(_pt), sy(_pt), plaza.radius * k + grow, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      strokeStreets(ROAD_WIDTH * k + outline, INK)
      fillPlazas(outline / 2, INK)
      strokeStreets(ROAD_WIDTH * k, PAPER)
      fillPlazas(0, PAPER)

      // ── Buildings: true footprints, projected corner by corner so they bend with the map
      ctx.fillStyle = BLOCK
      for (const b of BUILDINGS) {
        projectToMap(_c, _h, b.p, _pt)
        if (_pt.dist > viewRadius + 8) continue
        ctx.beginPath()
        for (let i = 0; i < 4; i++) {
          const a = i === 0 || i === 3 ? -1 : 1
          const f = i < 2 ? -1 : 1
          _q.copy(b.p)
            .addScaledVector(b.side, (a * b.size[0]) / 2 / PLANET_RADIUS)
            .addScaledVector(b.front, (f * b.size[2]) / 2 / PLANET_RADIUS)
            .normalize()
          projectToMap(_c, _h, _q, _pt)
          if (i === 0) ctx.moveTo(sx(_pt), sy(_pt))
          else ctx.lineTo(sx(_pt), sy(_pt))
        }
        ctx.closePath()
        ctx.fill()
      }

      // ── Markers. Off-map targets are pinned to the rim, pointing outward.
      const rimR = radiusPx - 9 * dpr * u
      const place = (unit: Vector3) => {
        projectToMap(_c, _h, unit, _pt)
        const inView = _pt.dist * k <= rimR
        if (inView) return { x: sx(_pt), y: sy(_pt), inView, angle: 0 }
        const angle = Math.atan2(_pt.x, _pt.y)
        return { x: cx + Math.sin(angle) * rimR, y: cy - Math.cos(angle) * rimR, inView, angle }
      }
      const fontPx = Math.max(8, (world ? 8.5 * u * 1.15 : 8.5) * dpr)
      ctx.font = `700 ${fontPx}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      const halo = (text: string, x: number, y: number) => {
        ctx.lineWidth = 3 * dpr
        ctx.strokeStyle = PAPER
        ctx.strokeText(text, x, y)
        ctx.fillStyle = INK
        ctx.fillText(text, x, y)
      }

      // Nearest first, so when labels would collide the closer district keeps its name
      projectToMap(_c, _h, _p, _pt2)
      const shown = getDistrictUnits()
        .map((d) => ({ d, m: place(d.unit), dist: projectToMap(_c, _h, d.unit, _pt).dist }))
        .sort((a, b) => a.dist - b.dist)
      const labelled: { x: number; y: number }[] = []
      const targets: { path: DistrictName; x: number; y: number }[] = []
      for (const { d, m } of shown) {
        const r = 4.4 * dpr * u
        const here = state.currentDistrict === d.path
        const visited = here || state.visitedDistricts.includes(d.path)
        targets.push({ path: d.path, x: m.x / dpr, y: m.y / dpr })
        ctx.save()
        ctx.translate(m.x, m.y)
        if (!m.inView) ctx.rotate(m.angle)
        ctx.beginPath()
        if (m.inView) {
          ctx.moveTo(0, -r)
          ctx.lineTo(r, 0)
          ctx.lineTo(0, r)
          ctx.lineTo(-r, 0)
        } else {
          ctx.moveTo(0, -r * 1.1)
          ctx.lineTo(r, r * 0.7)
          ctx.lineTo(-r, r * 0.7)
        }
        ctx.closePath()
        if (visited) {
          // solid ink with a paper ring so it holds on any background
          ctx.lineWidth = 3.4 * dpr * u
          ctx.strokeStyle = PAPER
          ctx.stroke()
          ctx.fillStyle = INK
          ctx.fill()
        } else {
          ctx.fillStyle = PAPER
          ctx.fill()
          ctx.lineWidth = 1.8 * dpr * u
          ctx.strokeStyle = INK
          ctx.stroke()
        }
        if (here && world) {
          ctx.beginPath()
          ctx.arc(0, 0, r * 2, 0, Math.PI * 2)
          ctx.lineWidth = 1.6 * dpr
          ctx.strokeStyle = INK
          ctx.setLineDash([3 * dpr, 3 * dpr])
          ctx.stroke()
          ctx.setLineDash([])
        }
        ctx.restore()
        // Label below in-view markers, tucked inward for rim markers
        const gap = (world ? 15 : 10) * dpr * (world ? 1 : 1)
        const lx = m.inView ? m.x : m.x - Math.sin(m.angle) * 12 * dpr
        const ly = m.inView ? m.y + gap : m.y + Math.cos(m.angle) * 12 * dpr
        if (labelled.every((o) => Math.hypot(o.x - lx, o.y - ly) > (world ? 40 : 30) * dpr)) {
          halo(d.label, lx, ly)
          labelled.push({ x: lx, y: ly })
        }
      }
      hitTargets.current = targets

      // Abdulrahman
      _q.set(state.abdulrahmanPosition[0], state.abdulrahmanPosition[1], state.abdulrahmanPosition[2]).normalize()
      const g = place(_q)
      ctx.beginPath()
      ctx.arc(g.x, g.y, 4 * dpr * u, 0, Math.PI * 2)
      ctx.fillStyle = PAPER
      ctx.fill()
      ctx.lineWidth = 2 * dpr * u
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(g.x, g.y, 1.4 * dpr * u, 0, Math.PI * 2)
      ctx.fillStyle = INK
      ctx.fill()
      if (world) halo('ABDULRAHMAN', g.x, g.y - 12 * dpr * u)

      // ── You: where you stand and which way you face. The facing is read off the map
      // itself (a point one metre ahead), so it is right in any frame.
      const you = place(_p)
      _ahead.copy(_p).addScaledVector(_face, 1 / PLANET_RADIUS).normalize()
      projectToMap(_c, _h, _ahead, _pt2)
      projectToMap(_c, _h, _p, _pt)
      const facing = Math.atan2(_pt2.x - _pt.x, _pt2.y - _pt.y)
      if (!world) {
        const wedge = (52 * Math.PI) / 180
        ctx.beginPath()
        ctx.moveTo(you.x, you.y)
        ctx.arc(you.x, you.y, 15 * k, -Math.PI / 2 + facing - wedge, -Math.PI / 2 + facing + wedge)
        ctx.closePath()
        ctx.fillStyle = 'rgba(11,11,11,0.16)'
        ctx.fill()
      }
      ctx.save()
      ctx.translate(you.x, you.y)
      ctx.rotate(facing)
      ctx.beginPath()
      ctx.moveTo(0, -6.5 * dpr * u)
      ctx.lineTo(4.6 * dpr * u, 5 * dpr * u)
      ctx.lineTo(0, 2.6 * dpr * u)
      ctx.lineTo(-4.6 * dpr * u, 5 * dpr * u)
      ctx.closePath()
      ctx.lineWidth = 3.6 * dpr * u
      ctx.strokeStyle = PAPER
      ctx.stroke()
      ctx.fillStyle = INK
      ctx.fill()
      ctx.restore()
      if (world) halo('YOU', you.x, you.y + 13 * dpr * u)
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < FRAME_MS || document.hidden) return
      // The corner map sleeps while the big one is up
      if (!world && useWorldStore.getState().mapOpen) return
      last = now
      draw()
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [world])

  return (
    <canvas
      ref={canvasRef}
      data-minimap
      data-map-variant={variant}
      className={className}
      onPointerUp={
        onPickDistrict
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              // A generous tap target: fingers are bigger than markers
              let best: { path: DistrictName; d: number } | null = null
              for (const t of hitTargets.current) {
                const d = Math.hypot(t.x - x, t.y - y)
                if (d < 34 && (!best || d < best.d)) best = { path: t.path, d }
              }
              if (best) onPickDistrict(best.path)
            }
          : undefined
      }
    />
  )
}
