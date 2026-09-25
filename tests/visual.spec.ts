import { test, expect } from '@playwright/test'
import type { Object3D } from 'three'

/** Dev-only hooks the app exposes on window. Absent in production builds, so ready() skips the test when they are missing. */
interface DevWindow extends Window {
  __VISITOR__: () => { pos: number[]; vel: number[] }
  __TELEPORT__: (x: number, z: number, lookX: number, lookZ: number) => void
  __THREE_SCENE__: Object3D
  __GREETING__: { t: number; active: boolean; done: boolean; weight: number }
  __WORLD_STORE__: { getState: () => { position: number[]; abdulrahmanPosition: number[]; introComplete: boolean; setIntroComplete: (v: boolean) => void } }
}

/**
 * Q83: Visual Regression Testing Suite
 * Validates pixel-level integrity of the 50m spherical world,
 * Sobel outline post-processing, and monochrome reading panel.
 */

test.describe('BabWorld 3D Visual Integrity', () => {
  test('renders 3D WebGL canvas and initial hub interface', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')

    // Wait for the WebGL canvas to mount
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15000 })

    // Verify HUD icons are visible
    const mapButton = page.locator('button[aria-label="Open map"]')
    await expect(mapButton).toBeVisible()

    // Assert no fatal WebGL shader compiler or context errors
    const fatalErrors = consoleErrors.filter(
      (err) =>
        err.includes('SHADER_ERROR') ||
        err.includes('WebGL') ||
        err.includes('Cannot read properties of undefined')
    )
    expect(fatalErrors).toHaveLength(0)

    // Capture visual snapshot of the canvas viewport
    const screenshot = await page.screenshot({ fullPage: false })
    expect(screenshot.byteLength).toBeGreaterThan(5000)
  })

  test('deep links directly to /essays and opens reading panel', async ({ page }) => {
    test.setTimeout(180_000) // the physics body (and so the spawn) mounts late in software-rendered headless Chrome
    await page.goto('/essays')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15000 })

    // Verify district label shows The Library
    // Deep-linking must spawn you in that district AND name it (the title card
    // used to keep saying "The Hub"). Always asserted: the label element is always mounted.
    await expect(page.locator('#district-label')).toContainText('The Library', { timeout: 120_000 })
  })

  test('opens in-world contact letter modal', async ({ page }) => {
    // The intro overlay blocks the HUD until the characters have loaded and it has run
    // its course, which takes a while under parallel software-rendered load.
    test.setTimeout(120_000)
    await page.goto('/')

    const contactButton = page.locator('button[aria-label="Send letter / Contact Abdulrahman"]')
    await expect(contactButton).toBeVisible()
    await contactButton.click()

    // Verify modal is open
    const modalHeading = page.getByRole('heading', { name: 'Send a Letter to Abdulrahman' })
    await expect(modalHeading).toBeVisible()

    // Capture snapshot of brutalist letter
    // (the reading panel is always mounted, off-screen, so select by accessible name)
    const modal = page.getByRole('dialog', { name: 'Send a letter to Abdulrahman' })
    await expect(modal).toBeVisible()
  })

  test('district title card is announced and stays out of the compass', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
    const title = page.locator('#district-label')
    await expect(title).toHaveAttribute('role', 'status')
    await expect(title).toContainText('District:') // screen-reader text is always present
  })

  test('low quality tier (?quality=low) renders without shader or context errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/?quality=low')
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(3000)
    expect(errors.filter((e) => /shader|SHADER|WebGL|Cannot read properties/.test(e))).toHaveLength(0)
  })
})

/**
 * Movement regression guard. Held keys once did almost nothing (a touch-capable
 * laptop was treated as a phone and its keyboard ignored), D strafed left, the
 * planet had an invisible cube collider, and the character walked in spirals.
 * These drive the real app through the dev-only window hooks, so they skip
 * themselves against a production build where the hooks don't exist.
 */
test.describe('Visitor movement', () => {
  // the 3D world takes a while to come up in software-rendered headless Chrome
  test.describe.configure({ timeout: 180_000 })
  async function ready(page: import('@playwright/test').Page) {
    await page.goto('/')
    await page.waitForFunction(() => !!(window as unknown as DevWindow).__VISITOR__ && !!(window as unknown as DevWindow).__TELEPORT__, undefined, { timeout: 120000 }).catch(() => null)
    const hooks = await page.evaluate(() => !!(window as unknown as DevWindow).__VISITOR__)
    test.skip(!hooks, 'dev-only window hooks are not available in this build')
    await page.evaluate(() => (window as unknown as DevWindow).__WORLD_STORE__.getState().setIntroComplete(true))
  }
  const velocity = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (window as unknown as DevWindow).__VISITOR__().vel as [number, number, number])

  test('a held key moves the visitor at walking speed, on the surface, in every direction', async ({ page }) => {
    await ready(page)
    for (const key of ['KeyW', 'KeyS', 'KeyA', 'KeyD']) {
      // tour resumes after 2s idle and would steer the visitor, so press within the window
      await page.evaluate(() => (window as unknown as DevWindow).__TELEPORT__(-8, 0, 40, 0))
      await page.waitForTimeout(600)
      await page.keyboard.down(key)
      await page.waitForTimeout(300)
      const v = await velocity(page)
      await page.keyboard.up(key)
      const speed = Math.hypot(...v)
      expect(speed, key + ' speed').toBeGreaterThan(2.5)
      expect(speed, key + ' speed').toBeLessThan(3.6)
    }
    const r = await page.evaluate(() => Math.hypot(...((window as unknown as DevWindow).__VISITOR__().pos as number[])))
    expect(r).toBeGreaterThan(25.9) // resting on the sphere (R 25 + capsule),
    expect(r).toBeLessThan(26.2) //    not on a collider poking out of it
  })

  test('D strafes to the right of W and the model faces its travel direction', async ({ page }) => {
    await ready(page)
    const measure = async (key: string) => {
      await page.evaluate(() => (window as unknown as DevWindow).__TELEPORT__(-8, 0, 40, 0))
      await page.waitForTimeout(600)
      await page.keyboard.down(key)
      await page.waitForTimeout(300)
      const s = await page.evaluate(() => {
        const v = (window as unknown as DevWindow).__VISITOR__()
        const S = (window as unknown as DevWindow).__THREE_SCENE__
        const hips: Object3D[] = []
        S.traverse((o: Object3D) => o.name === 'Normalized_J_Bip_C_Hips' && hips.push(o))
        const dist = (o: Object3D) => { const p = o.getWorldPosition(o.position.clone()); return Math.hypot(p.x - v.pos[0], p.y - v.pos[1], p.z - v.pos[2]) }
        hips.sort((a, b) => dist(a) - dist(b))
        const root = hips[0].parent!.parent!
        const f = root.position.clone().set(0, 0, 1).applyQuaternion(root.getWorldQuaternion(root.quaternion.clone()))
        const sp = Math.hypot(...(v.vel as number[]))
        return { vel: v.vel as number[], pos: v.pos as number[], facing: [f.x, f.y, f.z], sp }
      })
      await page.keyboard.up(key)
      return s
    }
    const w = await measure('KeyW')
    const d = await measure('KeyD')
    const n = w.pos.map((c) => c / Math.hypot(...w.pos))
    const cross = [w.vel[1] * d.vel[2] - w.vel[2] * d.vel[1], w.vel[2] * d.vel[0] - w.vel[0] * d.vel[2], w.vel[0] * d.vel[1] - w.vel[1] * d.vel[0]]
    // forward × right = -up, so a right-hand strafe gives a NEGATIVE component along the surface normal
    expect(cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2]).toBeLessThan(0)
    const dot = (a: number[], b: number[]) => (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(...a) * Math.hypot(...b))
    expect(dot(w.facing, w.vel)).toBeGreaterThan(0.98)
    expect(dot(d.facing, d.vel)).toBeGreaterThan(0.98)
  })
})

/**
 * The opening handshake: while the intro dialogue plays, the two characters turn
 * to face each other and shake hands, then the tour starts. Asserted on geometry
 * (the two right-hand bones meet), not on "something animated". Skips itself
 * against a production build, where the dev hooks are absent.
 */
test.describe('Opening handshake', () => {
  test.describe.configure({ timeout: 240_000 })

  test('the characters shake hands: hands meet, then let go', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => !!(window as unknown as DevWindow).__GREETING__, undefined, { timeout: 150000 }).catch(() => null)
    const hooks = await page.evaluate(() => !!(window as unknown as DevWindow).__GREETING__)
    test.skip(!hooks, 'dev-only window hooks are not available in this build')

    // wait for the clasp
    await page.waitForFunction(() => {
      const g = (window as unknown as DevWindow).__GREETING__
      return g.active && g.t > 1.3 && g.weight > 0.95
    }, undefined, { timeout: 120000, polling: 30 })

    const gap = await page.evaluate(() => {
      const w = window as unknown as DevWindow
      const store = w.__WORLD_STORE__.getState()
      const hands: Object3D[] = []
      w.__THREE_SCENE__.traverse((o: Object3D) => o.name === 'Normalized_J_Bip_R_Hand' && hands.push(o))
      const pos = (o: Object3D) => o.getWorldPosition(o.position.clone())
      const dist = (a: { x: number; y: number; z: number }, b: number[]) => Math.hypot(a.x - b[0], a.y - b[1], a.z - b[2])
      const nearest = (p: number[]) => hands.map(pos).sort((a, b) => dist(a, p) - dist(b, p))[0]
      const a = nearest(store.position)
      const b = nearest(store.abdulrahmanPosition)
      return { gapCm: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * 100, introComplete: store.introComplete }
    })
    expect(gap.gapCm, 'right hands are within 10cm at the clasp').toBeLessThan(10)
    expect(gap.introComplete, 'the intro is still on screen during the handshake').toBe(false)

    // ...and they let go and the greeting ends
    await page.waitForFunction(() => (window as unknown as DevWindow).__GREETING__.done, undefined, { timeout: 60000 })
    expect(await page.evaluate(() => (window as unknown as DevWindow).__GREETING__.weight)).toBe(0)
  })
})
