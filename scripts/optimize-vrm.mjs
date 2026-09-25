#!/usr/bin/env node
/**
 * VRM asset diet (P4).
 *
 * Shrinks .vrm characters without touching anything the VRM runtime relies on.
 * gltf-transform is deliberately NOT used: it drops glTF extensions it doesn't
 * know (VRMC_vrm, VRMC_springBone, VRMC_materials_mtoon), which would silently
 * break the characters. This script rewrites the GLB directly and leaves the
 * whole JSON (nodes, skins, materials, extensions) alone.
 *
 *   1. Textures      Downscale to --max px (default 1024), the VRM thumbnail to
 *                    --thumb px (default 256), re-encode flat-colour textures as
 *                    palette PNG. Data textures (normal / shading-shift /
 *                    outline-width / uv-mask) keep full colour depth, resize only.
 *   2. Morph normals VRoid ships a NORMAL delta for every face blend-shape
 *                    target, all exactly zero. Dropped (behaviour-identical, and
 *                    it also removes per-frame morph-normal work at runtime).
 *   3. Morph targets The POSITION deltas are dense although each expression only
 *                    moves ~20% of the face. Re-encoded as core-glTF sparse
 *                    accessors (lossless, no extension).
 *   4. Meshopt       Vertex / index data compressed with EXT_meshopt_compression
 *                    (v0 bitstream — what three's decoder reads; the encoder's
 *                    default v1 is KHR_meshopt_compression and is NOT compatible).
 *
 * Every output is verified before it is written: each surviving accessor's
 * decoded values must equal the original exactly (±0 aside), every image must
 * decode, and nodes / materials / extensions must be untouched.
 *
 * Usage
 *   pnpm assets:vrm                 optimise public/*.vrm in place
 *   pnpm assets:vrm --dry           report only, write nothing
 *   pnpm assets:vrm --max=2048      texture cap in px
 *   pnpm assets:vrm --no-meshopt    skip step 4 (plain-glTF output)
 *   pnpm assets:vrm path/a.vrm ...  specific files
 *
 * In place: originals live in git (`git checkout -- public/x.vrm` restores).
 * Idempotent: re-running on an optimised file changes nothing further.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import sharp from 'sharp'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])

// ── args ───────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? Number(hit.split('=')[1]) : dflt
}
const DRY = args.includes('--dry')
const VERBOSE = args.includes('--verbose')
const MESHOPT = !args.includes('--no-meshopt')
const MAX_TEX = flag('max', 1024)
const MAX_THUMB = flag('thumb', 256)
const SPARSE_GAIN = 0.6 // sparse-encode a morph accessor only if it is ≤ 60% of dense
let files = args.filter((a) => !a.startsWith('--'))
if (files.length === 0) {
  const dir = join(process.cwd(), 'public')
  files = readdirSync(dir).filter((f) => f.endsWith('.vrm')).map((f) => join(dir, f))
}

// ── glTF constants ─────────────────────────────────────
const CT_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
const CT_ARRAY = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }
const TARGET_VERTEX = 34962
const TARGET_INDEX = 34963
const EXT_MESHOPT = 'EXT_meshopt_compression'

const fmt = (n) => (n < 1048576 ? `${(n / 1024).toFixed(0)}KB` : `${(n / 1048576).toFixed(2)}MB`)
const pad4 = (n) => (n + 3) & ~3
const asBytes = (typed) => new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength)

// ── GLB io ─────────────────────────────────────────────
function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB')
  const jsonLen = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))
  const binHeader = 20 + jsonLen
  const binLen = buf.readUInt32LE(binHeader)
  return { json, bin: buf.subarray(binHeader + 8, binHeader + 8 + binLen) }
}

function writeGlb(json, bin) {
  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length) - jsonBuf.length, 0x20)])
  const binBuf = Buffer.concat([bin, Buffer.alloc(pad4(bin.length) - bin.length, 0)])
  const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length
  const out = Buffer.alloc(total)
  out.writeUInt32LE(0x46546c67, 0)
  out.writeUInt32LE(2, 4)
  out.writeUInt32LE(total, 8)
  out.writeUInt32LE(jsonBuf.length, 12)
  out.writeUInt32LE(0x4e4f534a, 16)
  jsonBuf.copy(out, 20)
  const b = 20 + jsonBuf.length
  out.writeUInt32LE(binBuf.length, b)
  out.writeUInt32LE(0x004e4942, b + 4)
  binBuf.copy(out, b + 8)
  return out
}

// ── reader: dense + sparse + meshopt-compressed views ──
function makeReader(json, bin) {
  const cache = new Map()
  const viewBytes = (vi) => {
    if (cache.has(vi)) return cache.get(vi)
    const bv = json.bufferViews[vi]
    const ext = bv.extensions?.[EXT_MESHOPT]
    let bytes
    if (ext) {
      const src = bin.subarray(ext.byteOffset || 0, (ext.byteOffset || 0) + ext.byteLength)
      bytes = new Uint8Array(ext.count * ext.byteStride)
      MeshoptDecoder.decodeGltfBuffer(bytes, ext.count, ext.byteStride, src, ext.mode, ext.filter)
    } else {
      bytes = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)
    }
    cache.set(vi, bytes)
    return bytes
  }
  const scalar = (dv, ct, off) =>
    ct === 5126 ? dv.getFloat32(off, true)
    : ct === 5125 ? dv.getUint32(off, true)
    : ct === 5123 ? dv.getUint16(off, true)
    : ct === 5122 ? dv.getInt16(off, true)
    : ct === 5121 ? dv.getUint8(off)
    : dv.getInt8(off)
  const read = (index) => {
    const a = json.accessors[index]
    const n = NCOMP[a.type]
    const csz = CT_SIZE[a.componentType]
    const out = new CT_ARRAY[a.componentType](a.count * n)
    if (a.bufferView != null) {
      const bytes = viewBytes(a.bufferView)
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      const stride = json.bufferViews[a.bufferView].byteStride || n * csz
      for (let i = 0; i < a.count; i++)
        for (let c = 0; c < n; c++) out[i * n + c] = scalar(dv, a.componentType, (a.byteOffset || 0) + i * stride + c * csz)
    }
    if (a.sparse) {
      const { count, indices, values } = a.sparse
      const ib = viewBytes(indices.bufferView)
      const vb = viewBytes(values.bufferView)
      const idv = new DataView(ib.buffer, ib.byteOffset, ib.byteLength)
      const vdv = new DataView(vb.buffer, vb.byteOffset, vb.byteLength)
      for (let k = 0; k < count; k++) {
        const idx = scalar(idv, indices.componentType, (indices.byteOffset || 0) + k * CT_SIZE[indices.componentType])
        for (let c = 0; c < n; c++) out[idx * n + c] = scalar(vdv, a.componentType, (values.byteOffset || 0) + (k * n + c) * csz)
      }
    }
    return out
  }
  return { read }
}

// ── textures ───────────────────────────────────────────
function textureRoles(json) {
  const imageOf = (ti) => (ti == null ? null : json.textures[ti]?.source ?? null)
  const data = new Set() // images that must keep full colour precision
  let thumb = null
  if (json.extensions?.VRMC_vrm?.meta?.thumbnailImage != null) thumb = json.extensions.VRMC_vrm.meta.thumbnailImage
  else if (json.extensions?.VRM?.meta?.texture != null) thumb = imageOf(json.extensions.VRM.meta.texture)
  for (const m of json.materials ?? []) {
    const mt = m.extensions?.VRMC_materials_mtoon ?? {}
    for (const ref of [m.normalTexture, mt.shadingShiftTexture, mt.outlineWidthMultiplyTexture, mt.uvAnimationMaskTexture]) {
      const src = imageOf(ref?.index)
      if (src != null) data.add(src)
    }
  }
  return { thumb, data }
}

async function reencodeImage(buf, { isThumb, isData }) {
  const meta = await sharp(buf).metadata()
  const cap = isThumb ? MAX_THUMB : MAX_TEX
  const needsResize = Math.max(meta.width, meta.height) > cap
  // PNG IHDR colour type 3 = indexed: already quantised, don't lose another generation
  const isIndexedPng = buf.length > 26 && buf.readUInt32BE(0) === 0x89504e47 && buf[25] === 3
  if (isIndexedPng && !needsResize) return buf
  if (isData && !needsResize) return buf
  let pipeline = sharp(buf).resize({ width: cap, height: cap, fit: 'inside', withoutEnlargement: true })
  pipeline = isData
    ? pipeline.png({ compressionLevel: 9, effort: 10 })
    : pipeline.png({ palette: true, quality: 90, effort: 10, dither: 0.6, colours: 256 })
  const out = await pipeline.toBuffer()
  return out.length < buf.length ? out : buf
}

// ── per-file pass ──────────────────────────────────────
async function optimise(file) {
  const original = readFileSync(file)
  const { json: oj, bin: obin } = parseGlb(original)
  const json = structuredClone(oj)
  const name = basename(file)
  const src = makeReader(oj, obin)
  const stat = { textures: [0, 0], 'morph targets': [0, 0], 'mesh + skin': [0, 0] }

  // 1. images
  const roles = textureRoles(json)
  const newImages = []
  for (let i = 0; i < json.images.length; i++) {
    const bv = oj.bufferViews[oj.images[i].bufferView]
    const raw = obin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)
    const out = await reencodeImage(raw, { isThumb: roles.thumb === i, isData: roles.data.has(i) })
    newImages.push(out)
    if (VERBOSE && raw.length - out.length > 1024) console.log(`      image #${i} ${fmt(raw.length)} → ${fmt(out.length)}${roles.data.has(i) ? ' (data)' : ''}${roles.thumb === i ? ' (thumbnail)' : ''}`)
    stat.textures[0] += raw.length
    stat.textures[1] += out.length
  }

  // 2. all-zero morph NORMAL / TANGENT deltas → dropped from the targets
  const dropped = new Set()
  for (const mesh of json.meshes ?? [])
    for (const prim of mesh.primitives) {
      if (!prim.targets?.length) continue
      for (const attr of ['NORMAL', 'TANGENT']) {
        const accs = prim.targets.map((t) => t[attr])
        if (accs.some((ai) => ai == null)) continue
        if (accs.every((ai) => src.read(ai).every((v) => v === 0))) {
          for (const t of prim.targets) {
            dropped.add(t[attr])
            delete t[attr]
          }
        }
      }
    }
  for (const ai of dropped) stat['morph targets'][0] += oj.accessors[ai].count * NCOMP[oj.accessors[ai].type] * 4

  // 3. morph POSITION deltas → sparse
  const morphAccessors = new Set()
  for (const mesh of json.meshes ?? [])
    for (const prim of mesh.primitives) for (const t of prim.targets ?? []) for (const ai of Object.values(t)) morphAccessors.add(ai)

  const sparseData = new Map()
  const zeroAccessors = new Set()
  for (const ai of morphAccessors) {
    const a = json.accessors[ai]
    if (a.componentType !== 5126) continue
    const n = NCOMP[a.type]
    const dense = src.read(ai)
    const nz = []
    for (let i = 0; i < a.count; i++)
      for (let c = 0; c < n; c++)
        if (dense[i * n + c] !== 0) {
          nz.push(i)
          break
        }
    const denseBytes = a.count * n * 4
    const isz = a.count < 65536 ? 2 : 4
    stat['morph targets'][0] += denseBytes
    if (nz.length === 0) {
      zeroAccessors.add(ai)
      continue
    }
    if (nz.length * (isz + n * 4) > denseBytes * SPARSE_GAIN) continue
    const idx = isz === 2 ? new Uint16Array(nz) : new Uint32Array(nz)
    const val = new Float32Array(nz.length * n)
    nz.forEach((vi, k) => {
      for (let c = 0; c < n; c++) val[k * n + c] = dense[vi * n + c]
    })
    sparseData.set(ai, { idx: asBytes(idx), val: asBytes(val), count: nz.length, isz, n })
  }

  // 4. drop orphaned accessors and remap every reference to them
  const referenced = new Set()
  for (const mesh of json.meshes ?? [])
    for (const prim of mesh.primitives) {
      Object.values(prim.attributes).forEach((a) => referenced.add(a))
      if (prim.indices != null) referenced.add(prim.indices)
      for (const t of prim.targets ?? []) Object.values(t).forEach((a) => referenced.add(a))
    }
  for (const s of json.skins ?? []) if (s.inverseBindMatrices != null) referenced.add(s.inverseBindMatrices)
  for (const an of json.animations ?? []) for (const sm of an.samplers) { referenced.add(sm.input); referenced.add(sm.output) }
  for (const ai of dropped) if (referenced.has(ai)) throw new Error(`${name}: dropped accessor ${ai} is still referenced`)
  const oldToNew = new Map()
  const keep = []
  json.accessors.forEach((a, ai) => {
    if (dropped.has(ai)) return
    oldToNew.set(ai, keep.length)
    keep.push({ a, ai })
  })
  const remap = (ai) => oldToNew.get(ai)
  for (const mesh of json.meshes ?? [])
    for (const prim of mesh.primitives) {
      for (const k of Object.keys(prim.attributes)) prim.attributes[k] = remap(prim.attributes[k])
      if (prim.indices != null) prim.indices = remap(prim.indices)
      for (const t of prim.targets ?? []) for (const k of Object.keys(t)) t[k] = remap(t[k])
    }
  for (const s of json.skins ?? []) if (s.inverseBindMatrices != null) s.inverseBindMatrices = remap(s.inverseBindMatrices)
  for (const an of json.animations ?? []) for (const sm of an.samplers) { sm.input = remap(sm.input); sm.output = remap(sm.output) }
  json.accessors = keep.map((k) => k.a)

  // 5. repack: one tight, aligned bufferView per accessor, optionally meshopt-compressed
  const role = new Map() // new accessor index → vertex / index usage
  for (const mesh of json.meshes ?? [])
    for (const prim of mesh.primitives) {
      const isTris = prim.mode == null || prim.mode === 4
      for (const ai of Object.values(prim.attributes)) role.set(ai, { target: TARGET_VERTEX })
      if (prim.indices != null) role.set(prim.indices, { target: TARGET_INDEX, tris: isTris })
      for (const t of prim.targets ?? []) for (const ai of Object.values(t)) role.set(ai, { target: TARGET_VERTEX })
    }

  const main = [] // payloads stored in buffer 0 (the BIN chunk)
  let mainCursor = 0
  let fallbackCursor = 0 // virtual size of the uncompressed fallback buffer (buffer 1)
  let anyCompressed = false
  const views = []
  const push = (data) => {
    const off = mainCursor
    main.push(data, Buffer.alloc(pad4(data.length) - data.length))
    mainCursor += pad4(data.length)
    return off
  }
  const addRaw = (data, target) => {
    const view = { buffer: 0, byteOffset: push(data), byteLength: data.length }
    if (target) view.target = target
    views.push(view)
    return views.length - 1
  }
  // mode: 'ATTRIBUTES' | 'TRIANGLES' | null. Falls back to raw when compression isn't clearly smaller.
  const addView = (bytes, { target, mode, count, stride, sparse }, category) => {
    if (MESHOPT && mode) {
      const comp = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode)
      if (comp.length < bytes.length * 0.95) {
        const view = {
          buffer: 1,
          byteOffset: fallbackCursor,
          byteLength: bytes.length,
          extensions: {
            [EXT_MESHOPT]: { buffer: 0, byteOffset: push(Buffer.from(comp)), byteLength: comp.length, byteStride: stride, count, mode },
          },
        }
        // glTF forbids byteStride / target on views that hold sparse data
        if (mode === 'ATTRIBUTES' && !sparse) view.byteStride = stride
        if (target) view.target = target
        fallbackCursor += pad4(bytes.length)
        views.push(view)
        anyCompressed = true
        stat[category][1] += comp.length
        return views.length - 1
      }
    }
    stat[category][1] += bytes.length
    return addRaw(Buffer.from(bytes), target)
  }

  json.accessors.forEach((a, ni) => {
    const oi = keep[ni].ai
    const r = role.get(ni)
    if (sparseData.has(oi)) {
      const s = sparseData.get(oi)
      delete a.bufferView
      delete a.byteOffset
      const values = addView(s.val, { mode: 'ATTRIBUTES', count: s.count, stride: s.n * 4, sparse: true }, 'morph targets')
      stat['morph targets'][1] += s.idx.length
      a.sparse = {
        count: s.count,
        indices: { bufferView: addRaw(Buffer.from(s.idx)), componentType: s.isz === 2 ? 5123 : 5125 },
        values: { bufferView: values },
      }
      return
    }
    if (zeroAccessors.has(oi)) {
      // all zeros: an accessor with neither bufferView nor sparse is defined as zero-filled
      delete a.bufferView
      delete a.byteOffset
      delete a.sparse
      return
    }
    if (a.bufferView == null && !a.sparse) return
    const tight = asBytes(src.read(oi))
    const elem = NCOMP[a.type] * CT_SIZE[a.componentType]
    const category = morphAccessors.has(oi) ? 'morph targets' : 'mesh + skin'
    if (category === 'mesh + skin') stat[category][0] += tight.length
    let mode = null
    if (r?.target === TARGET_VERTEX && elem % 4 === 0 && elem <= 256) mode = 'ATTRIBUTES'
    if (r?.target === TARGET_INDEX && r.tris && (elem === 2 || elem === 4) && a.count % 3 === 0) mode = 'TRIANGLES'
    delete a.sparse
    delete a.byteOffset
    a.bufferView = addView(tight, { target: r?.target, mode, count: a.count, stride: elem }, category)
  })
  json.images.forEach((img, i) => {
    img.bufferView = addRaw(Buffer.from(newImages[i]))
  })
  json.bufferViews = views
  json.buffers = [{ byteLength: mainCursor }]
  if (anyCompressed) {
    json.buffers.push({ byteLength: fallbackCursor, extensions: { [EXT_MESHOPT]: { fallback: true } } })
    json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), EXT_MESHOPT])]
    json.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []), EXT_MESHOPT])]
  }
  const output = writeGlb(json, Buffer.concat(main))

  // 6. verify against the original
  const { json: vj, bin: vbin } = parseGlb(output)
  const out = makeReader(vj, vbin)
  // The meshopt index codec may rotate the vertex order inside a triangle
  // (a,b,c → b,c,a). Same triangle, same winding — so index buffers are compared
  // as triangle lists in canonical rotation; everything else must match exactly.
  const triIndexAccessors = new Set()
  for (const mesh of oj.meshes ?? [])
    for (const prim of mesh.primitives) if (prim.indices != null && (prim.mode == null || prim.mode === 4)) triIndexAccessors.add(prim.indices)
  const canonTriangles = (idx) => {
    const c = Uint32Array.from(idx)
    for (let t = 0; t < c.length; t += 3) {
      const [a, b, d] = [c[t], c[t + 1], c[t + 2]]
      if (b <= a && b <= d) { c[t] = b; c[t + 1] = d; c[t + 2] = a }
      else if (d <= a && d <= b) { c[t] = d; c[t + 1] = a; c[t + 2] = b }
    }
    return c
  }
  let checked = 0
  for (const [oi, ni] of oldToNew) {
    let want = src.read(oi)
    let got = out.read(ni)
    if (triIndexAccessors.has(oi)) {
      want = canonTriangles(want)
      got = canonTriangles(got)
    }
    if (want.length !== got.length) throw new Error(`${name}: accessor ${oi} length changed`)
    for (let k = 0; k < want.length; k++)
      if (want[k] !== got[k]) throw new Error(`${name}: accessor ${oi} value ${k} changed (${want[k]} → ${got[k]})`)
    checked++
  }
  for (let i = 0; i < vj.images.length; i++) {
    const bv = vj.bufferViews[vj.images[i].bufferView]
    const m = await sharp(vbin.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength)).metadata()
    if (!m.width) throw new Error(`${name}: image ${i} does not decode`)
  }
  const stripAcc = (skins) => JSON.stringify(skins?.map((skin) => { const rest = { ...skin }; delete rest.inverseBindMatrices; return rest }))
  for (const key of ['nodes', 'materials', 'textures', 'extensions', 'scenes', 'scene', 'samplers', 'asset'])
    if (JSON.stringify(oj[key]) !== JSON.stringify(vj[key])) throw new Error(`${name}: '${key}' changed unexpectedly`)
  if (stripAcc(oj.skins) !== stripAcc(vj.skins)) throw new Error(`${name}: skins changed unexpectedly`)
  for (const e of oj.extensionsUsed ?? []) if (!vj.extensionsUsed.includes(e)) throw new Error(`${name}: lost extension ${e}`)

  console.log(`▸ ${name}  ${fmt(original.length)} → ${fmt(output.length)}  (${((1 - output.length / original.length) * 100).toFixed(0)}% smaller)`)
  for (const [label, [b, a]] of Object.entries(stat))
    if (b || a) console.log(`    ${label.padEnd(14)} ${b ? fmt(b).padStart(8) : '       -'} → ${fmt(a).padStart(8)}`)
  console.log(
    `    verified: ${checked} accessors identical (${dropped.size} all-zero normal deltas dropped, ${sparseData.size} morph accessors sparse), ${vj.images.length} images decode`
  )
  if (!DRY) writeFileSync(file, output)
  return { before: original.length, after: output.length }
}

let before = 0
let after = 0
for (const f of files) {
  const r = await optimise(f)
  before += r.before
  after += r.after
}
console.log(`\nTotal ${fmt(before)} → ${fmt(after)}${DRY ? '  (dry run — nothing written)' : ''}`)
