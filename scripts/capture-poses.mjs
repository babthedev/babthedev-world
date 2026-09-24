// Visual comparison harness: captures the world from a fixed set of
// camera poses and assembles them into one contact sheet.
//
//   pnpm dev --port 3004        (in another terminal)
//   pnpm capture:poses [label]  → captures/<label>/*.png + contact.png
//
// Requires the dev-only window.__TELEPORT__ / __WORLD_STORE__ hooks.
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.CAPTURE_URL ?? 'http://localhost:3004'
const label = process.argv[2] ?? 'latest'
const outDir = join(process.cwd(), 'captures', label)
mkdirSync(outDir, { recursive: true })

// [name, standX, standZ, lookX, lookZ] in flat-world coordinates
const POSES = [
  ['hub', -4, 0, 40, 0],
  ['east-street', 16, 0, 40, 0],
  ['projects', 31, 0, 40, 0],
  ['ring', 34.6, -20, 20, -34.6],
  ['essays', 0, -31, 0, -40],
  ['bio', -31, 0, -40, 0],
  ['frontage', 16, 3.5, 16, 8],
]

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=default'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(
  () => {
    const s = window.__THREE_SCENE__
    if (!s || !window.__TELEPORT__) return false
    let n = 0
    s.traverse((o) => o.isMesh && n++)
    return n > 20
  },
  { timeout: 120000 }
)
await page.evaluate(() => window.__WORLD_STORE__?.getState().setIntroComplete(true))
await page.waitForTimeout(1500)

for (const [name, x, z, lx, lz] of POSES) {
  await page.evaluate(([x, z, lx, lz]) => window.__TELEPORT__(x, z, lx, lz), [x, z, lx, lz])
  await page.waitForTimeout(2500) // camera lerp + guide catch-up
  await page.screenshot({ path: join(outDir, `${name}.png`) })
  console.log(`captured ${name}`)
}

// Count one whole frame (all passes) rather than the last post pass only
const stats = await page.evaluate(async () => {
  const r = window.__THREE_RENDERER__
  if (!r) return null
  r.info.autoReset = false
  await new Promise((res) => requestAnimationFrame(res))
  r.info.reset()
  await new Promise((res) => requestAnimationFrame(res))
  const out = { calls: r.info.render.calls, triangles: r.info.render.triangles }
  r.info.autoReset = true
  return out
})

// Contact sheet: render the captures into a grid and screenshot it
const imgs = POSES.map(([name]) => {
  const b64 = readFileSync(join(outDir, `${name}.png`)).toString('base64')
  return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${name}</figcaption></figure>`
}).join('')
const sheet = await browser.newPage({ viewport: { width: 1920, height: 740 } })
await sheet.setContent(`<style>
  body{margin:0;background:#111;display:grid;align-content:start;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;font:14px monospace;color:#eee}
  figure{margin:0;position:relative} img{width:100%;display:block}
  figcaption{position:absolute;left:6px;top:4px;background:#000a;padding:2px 6px}
</style>${imgs}`)
await sheet.screenshot({ path: join(outDir, 'contact.png'), fullPage: true })

console.log(`\ncontact sheet: ${join(outDir, 'contact.png')}`)
if (stats) console.log(`render stats (last frame): ${stats.calls} draw calls, ${stats.triangles} triangles`)
if (errors.length) {
  console.log(`\n${errors.length} page errors:`)
  for (const e of [...new Set(errors)].slice(0, 15)) console.log(' -', e.slice(0, 300))
}
await browser.close()
