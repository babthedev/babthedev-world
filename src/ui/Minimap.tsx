'use client'

import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { cameraRig } from '@/lib/cameraRig'
import { PLANET_RADIUS } from '@/lib/constants'
import { settleFacing } from '@/lib/sphereMath'
import { angleOnMap, projectToMap, type MapPoint } from '@/lib/minimap'
import { BUILDINGS, PLAZAS, STREETS, flatToUnit } from '@/lib/streetLayout'
import { WORLD_COORDINATES, type DistrictName } from '@/lib/worldCoordinates'

const INK = '#0B0B0B'
const PAPER = '#F3F2ED'
const GROUND = '#D9D7D0'
const BLOCK = '#1B1B1B'

/** How far, in metres of surface distance, the map shows in every direction */
const VIEW_RADIUS = 30
const ROAD_WIDTH = 6
const FRAME_MS = 1000 / 24

const MAP_DISTRICTS: { path: DistrictName; label: string }[] = [
  { path: '/', label: 'HUB' },
  { path: '/projects', label: 'PROJECTS' },
  { path: '/essays', label: 'LIBRARY' },
  { path: '/bio', label: 'TERRACE' },
]

const _p = new Vector3()
const _heading = new Vector3()
const _face = new Vector3()
const _q = new Vector3()
const _pt: MapPoint = { x: 0, y: 0, dist: 0 }

// Static map data, built once
let districtUnits: { path: DistrictName; label: string; unit: Vector3 }[] | null = null
const getDistrictUnits = () =>
  (districtUnits ??= MAP_DISTRICTS.map((d) => {
    const [x, , z] = WORLD_COORDINATES[d.path].sensorPoint
    return { ...d, unit: flatToUnit(x, z) }
  }))

/**
 * Circular minimap, bottom-left. Centred on the visitor, "up" is the way the camera
 * looks. Streets are light lanes between dark building blocks; diamonds are the
 * districts (filled once visited), the round marker is Abdulrahman. Anything outside
 * the view is pinned to the rim so it always points the way.
 */
export default function Minimap() {
  const introComplete = useWorldStore((s) => s.introComplete)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      const k = (radiusPx - 3 * dpr) / VIEW_RADIUS // pixels per metre

      _p.set(state.position[0], state.position[1], state.position[2]).normalize()
      _heading.copy(cameraRig.heading)
      settleFacing(_p, _heading)

      const sx = (pt: MapPoint) => cx + pt.x * k
      const sy = (pt: MapPoint) => cy - pt.y * k

      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = GROUND
      ctx.fillRect(0, 0, size, size)

      // ── Streets and plazas: an ink outline pass, then a paper fill pass, so
      // junctions merge into one clean shape
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const strokeStreets = (width: number, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        for (const street of STREETS) {
          ctx.beginPath()
          let pen = false
          for (const smp of street.samples) {
            projectToMap(_p, _heading, smp.p, _pt)
            if (_pt.dist > VIEW_RADIUS * 1.5) {
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
          projectToMap(_p, _heading, plaza.center, _pt)
          if (_pt.dist > VIEW_RADIUS + plaza.radius) continue
          ctx.beginPath()
          ctx.arc(sx(_pt), sy(_pt), plaza.radius * k + grow, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      strokeStreets(ROAD_WIDTH * k + 3 * dpr, INK)
      fillPlazas(1.5 * dpr, INK)
      strokeStreets(ROAD_WIDTH * k, PAPER)
      fillPlazas(0, PAPER)

      // ── Buildings: true footprints, projected corner by corner so they bend with the map
      ctx.fillStyle = BLOCK
      for (const b of BUILDINGS) {
        projectToMap(_p, _heading, b.p, _pt)
        if (_pt.dist > VIEW_RADIUS + 8) continue
        ctx.beginPath()
        for (let i = 0; i < 4; i++) {
          const a = i === 0 || i === 3 ? -1 : 1
          const f = i < 2 ? -1 : 1
          _q.copy(b.p)
            .addScaledVector(b.side, (a * b.size[0]) / 2 / PLANET_RADIUS)
            .addScaledVector(b.front, (f * b.size[2]) / 2 / PLANET_RADIUS)
            .normalize()
          projectToMap(_p, _heading, _q, _pt)
          if (i === 0) ctx.moveTo(sx(_pt), sy(_pt))
          else ctx.lineTo(sx(_pt), sy(_pt))
        }
        ctx.closePath()
        ctx.fill()
      }

      // ── Markers. Off-map targets are pinned to the rim, pointing outward.
      const rimR = radiusPx - 9 * dpr
      const place = (unit: Vector3) => {
        projectToMap(_p, _heading, unit, _pt)
        const inView = _pt.dist * k <= rimR
        if (inView) return { x: sx(_pt), y: sy(_pt), inView, angle: 0 }
        const angle = Math.atan2(_pt.x, _pt.y)
        return { x: cx + Math.sin(angle) * rimR, y: cy - Math.cos(angle) * rimR, inView, angle }
      }
      const halo = (text: string, x: number, y: number) => {
        ctx.lineWidth = 3 * dpr
        ctx.strokeStyle = PAPER
        ctx.strokeText(text, x, y)
        ctx.fillStyle = INK
        ctx.fillText(text, x, y)
      }
      ctx.font = `700 ${Math.max(8, 8.5 * dpr)}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'

      // Nearest first, so when labels would collide the closer district keeps its name
      const shown = getDistrictUnits()
        .map((d) => ({ d, m: place(d.unit), dist: projectToMap(_p, _heading, d.unit, _pt).dist }))
        .sort((a, b) => a.dist - b.dist)
      const labelled: { x: number; y: number }[] = []
      for (const { d, m } of shown) {
        const r = 4.4 * dpr
        const here = state.currentDistrict === d.path
        const visited = here || state.visitedDistricts.includes(d.path)
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
          ctx.lineWidth = 3.4 * dpr
          ctx.strokeStyle = PAPER
          ctx.stroke()
          ctx.fillStyle = INK
          ctx.fill()
        } else {
          ctx.fillStyle = PAPER
          ctx.fill()
          ctx.lineWidth = 1.8 * dpr
          ctx.strokeStyle = INK
          ctx.stroke()
        }
        ctx.restore()
        // Label below in-view markers, tucked inward for rim markers
        const lx = m.inView ? m.x : m.x - Math.sin(m.angle) * 12 * dpr
        const ly = m.inView ? m.y + 10 * dpr : m.y + Math.cos(m.angle) * 12 * dpr
        if (labelled.every((o) => Math.hypot(o.x - lx, o.y - ly) > 30 * dpr)) {
          halo(d.label, lx, ly)
          labelled.push({ x: lx, y: ly })
        }
      }

      // Abdulrahman
      _q.set(state.abdulrahmanPosition[0], state.abdulrahmanPosition[1], state.abdulrahmanPosition[2]).normalize()
      const g = place(_q)
      ctx.beginPath()
      ctx.arc(g.x, g.y, 4 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = PAPER
      ctx.fill()
      ctx.lineWidth = 2 * dpr
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(g.x, g.y, 1.4 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = INK
      ctx.fill()

      // ── You: a soft view wedge and an arrow pointing along your facing
      _face.set(state.facingDir[0], state.facingDir[1], state.facingDir[2])
      settleFacing(_p, _face)
      const facing = angleOnMap(_p, _heading, _face)
      const wedge = (52 * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, 15 * k, -Math.PI / 2 + facing - wedge, -Math.PI / 2 + facing + wedge)
      ctx.closePath()
      ctx.fillStyle = 'rgba(11,11,11,0.16)'
      ctx.fill()
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(facing)
      ctx.beginPath()
      ctx.moveTo(0, -6.5 * dpr)
      ctx.lineTo(4.6 * dpr, 5 * dpr)
      ctx.lineTo(0, 2.6 * dpr)
      ctx.lineTo(-4.6 * dpr, 5 * dpr)
      ctx.closePath()
      ctx.lineWidth = 3.6 * dpr
      ctx.strokeStyle = PAPER
      ctx.stroke()
      ctx.fillStyle = INK
      ctx.fill()
      ctx.restore()
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < FRAME_MS || document.hidden) return
      last = now
      draw()
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      role="img"
      aria-label="Minimap of the surrounding streets and districts"
      className={`pointer-events-none fixed bottom-4 left-4 z-20 transition-opacity duration-500 md:bottom-6 md:left-6 ${
        introComplete ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <canvas
        ref={canvasRef}
        data-minimap
        className="block h-[132px] w-[132px] rounded-full border-2 border-[#0B0B0B] bg-[#D9D7D0] shadow-[3px_3px_0_0_#0B0B0B] md:h-[176px] md:w-[176px]"
      />
    </div>
  )
}
