import { CanvasTexture, LinearMipmapLinearFilter, LinearFilter, SRGBColorSpace } from 'three'

// ============================================================
// GLYPH SIGNAGE (P5)
//
// Messenger's signs use an invented, blocky script that looks like writing
// without being readable in any language. This generates one: each glyph is a
// few horizontal/vertical bars and blocks on a small grid, and a sign is a row
// (or, for banners, a column) of them on a bordered plate.
//
// Deterministic (seeded), drawn to a canvas at runtime, no assets. When real
// signage art exists, replace signTexture() and nothing else changes.
// ============================================================

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const COLS = 4
const ROWS = 6

/** One glyph: 2–4 strokes on a COLS x ROWS grid, always at least one long stroke so it has a "spine". */
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const cw = w / COLS
  const ch = h / ROWS
  const strokes = 2 + Math.floor(rand() * 3)
  for (let i = 0; i < strokes; i++) {
    const kind = i === 0 ? (rand() < 0.5 ? 'h' : 'v') : (['h', 'v', 'b'] as const)[Math.floor(rand() * 3)]
    if (kind === 'h') {
      const row = Math.floor(rand() * ROWS)
      const a = Math.floor(rand() * 2)
      const b = COLS - 1 - Math.floor(rand() * 2)
      ctx.fillRect(x + a * cw, y + row * ch, (b - a + 1) * cw, ch * 0.9)
    } else if (kind === 'v') {
      const col = Math.floor(rand() * COLS)
      const a = Math.floor(rand() * 2)
      const b = ROWS - 1 - Math.floor(rand() * 2)
      ctx.fillRect(x + col * cw, y + a * ch, cw * 0.9, (b - a + 1) * ch)
    } else {
      ctx.fillRect(x + Math.floor(rand() * COLS) * cw, y + Math.floor(rand() * ROWS) * ch, cw * 1.6, ch * 1.6)
    }
  }
}

export interface SignSpec {
  w: number // metres
  h: number
  dark: boolean
  vertical: boolean
}

/** A sign plate texture: bordered plate, blocky glyphs. `dark` inverts the polarity. */
export function signTexture(variant: number, spec: SignSpec): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const PX = 160 // pixels per metre — crisp at street distance, tiny in memory
  const cw = Math.max(64, Math.round(spec.w * PX))
  const ch = Math.max(48, Math.round(spec.h * PX))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = spec.dark ? '#151515' : '#F3F2ED'
  const fg = spec.dark ? '#F3F2ED' : '#151515'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cw, ch)
  ctx.strokeStyle = fg
  ctx.lineWidth = Math.max(3, Math.min(cw, ch) * 0.05)
  const inset = ctx.lineWidth * 1.4
  ctx.strokeRect(inset, inset, cw - inset * 2, ch - inset * 2)

  const rand = rng(1009 * (variant + 1) + 7)
  ctx.fillStyle = fg
  const pad = inset * 2.2
  const innerW = cw - pad * 2
  const innerH = ch - pad * 2

  if (spec.vertical) {
    // banner: a column of glyphs
    const n = 3 + Math.floor(rand() * 3)
    const cell = Math.min(innerW, innerH / n)
    const gw = cell * 0.78
    const gh = cell * 0.86
    const top = pad + (innerH - n * cell) / 2
    for (let i = 0; i < n; i++) drawGlyph(ctx, rand, (cw - gw) / 2, top + i * cell + (cell - gh) / 2, gw, gh)
  } else {
    // plate: a row of glyphs
    const n = 3 + Math.floor(rand() * 4)
    const gh = innerH * 0.78
    const gw = Math.min(gh * 0.72, (innerW / n) * 0.8)
    const step = innerW / n
    for (let i = 0; i < n; i++) drawGlyph(ctx, rand, pad + i * step + (step - gw) / 2, (ch - gh) / 2, gw, gh)
  }

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.minFilter = LinearMipmapLinearFilter
  tex.magFilter = LinearFilter
  tex.anisotropy = 8
  return tex
}
