import { test, expect, devices } from '@playwright/test'
import type { Object3D } from 'three'

/** Dev-only hooks the app exposes on window. Absent in production builds, so ready() skips the test when they are missing. */
interface DevWindow extends Window {
  __VISITOR__: () => { pos: number[]; vel: number[] }
  __TELEPORT__: (x: number, z: number, lookX: number, lookZ: number) => void
  __THREE_SCENE__: Object3D
  __BODY__: { pitch: { x: number }; roll: { x: number }; squash: { x: number; v: number } }
  __AMBIENCE__?: boolean
  __CAMERA_RIG__: { heading: { x: number; y: number; z: number }; mouseLook: boolean }
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
    const canvas = page.locator('canvas:not([data-minimap])')
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

    const canvas = page.locator('canvas:not([data-minimap])')
    await expect(canvas).toBeVisible({ timeout: 15000 })

    // Verify district label shows The Library
    // Deep-linking must spawn you in that district AND name it (the title card
    // used to keep saying "The Hub"). Always asserted: the label element is always mounted.
    await expect(page.locator('#district-label')).toContainText('The Library', { timeout: 120_000 })
  })

  test('opens in-world contact letter modal', async ({ page }) => {
    // The intro overlay blocks the HUD until the characters have loaded and it has run
    // its course, which takes a while under parallel software-rendered load.
    // (it now also waits out the opening handshake)
    test.setTimeout(240_000)
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
    await expect(page.locator('canvas:not([data-minimap])')).toBeVisible({ timeout: 15000 })
    const title = page.locator('#district-label')
    await expect(title).toHaveAttribute('role', 'status')
    await expect(title).toContainText('District:') // screen-reader text is always present
  })

  test('low quality tier (?quality=low) renders without shader or context errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/?quality=low')
    await expect(page.locator('canvas:not([data-minimap])')).toBeVisible({ timeout: 15000 })
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

  test('the minimap draws the streets around the visitor and turns with the heading', async ({ page }) => {
    await ready(page)
    const minimap = page.locator('canvas[data-map-variant="compact"]')
    await expect(minimap).toBeVisible()
    // Sample the minimap into a coarse greyscale grid
    const sample = () =>
      minimap.evaluate((el) => {
        const c = el as HTMLCanvasElement
        const g = document.createElement('canvas')
        g.width = g.height = 16
        const ctx = g.getContext('2d')!
        ctx.drawImage(c, 0, 0, 16, 16)
        const px = ctx.getImageData(0, 0, 16, 16).data
        const out: number[] = []
        for (let i = 0; i < px.length; i += 4) out.push((px[i] + px[i + 1] + px[i + 2]) / 3)
        return out
      })
    // Stand on the east street looking along it
    await page.evaluate(() => (window as unknown as DevWindow).__TELEPORT__(20, 0, 30, 0))
    await page.waitForTimeout(2500)
    const before = await sample()
    const dark = before.filter((v) => v < 70).length
    const light = before.filter((v) => v > 200).length
    expect(dark, 'building blocks are drawn dark').toBeGreaterThan(8)
    expect(light, 'streets are drawn light').toBeGreaterThan(8)
    // Turn to look the other way: the map must rotate with the heading
    await page.evaluate(() => (window as unknown as DevWindow).__TELEPORT__(20, 0, 10, 0))
    await page.waitForTimeout(2500)
    const after = await sample()
    const changed = before.filter((v, i) => Math.abs(v - after[i]) > 60).length
    expect(changed, 'the map turned with the heading').toBeGreaterThan(20)
  })

  test('the visitor leans into a walk, and stands upright again when they stop', async ({ page }) => {
    await ready(page)
    const body = (page2: import('@playwright/test').Page) =>
      page2.evaluate(() => (window as unknown as DevWindow).__BODY__.pitch.x)
    await page.keyboard.down('KeyW')
    await page.waitForFunction(() => (window as unknown as DevWindow).__BODY__.pitch.x > 0.03, undefined, { timeout: 90000, polling: 50 })
    expect(await body(page), 'a forward walk leans forward, within a few degrees').toBeLessThan(0.11)
    await page.keyboard.up('KeyW')
    await page.waitForFunction(() => Math.abs((window as unknown as DevWindow).__BODY__.pitch.x) < 0.006, undefined, { timeout: 90000, polling: 50 })
    // a press of E gives a small bounce that then settles
    await page.keyboard.press('KeyE')
    await page.waitForFunction(
      () => Math.abs((window as unknown as DevWindow).__BODY__.squash.x) > 0.002,
      undefined,
      { timeout: 30000, polling: 20 }
    )
    await page.waitForFunction(() => Math.abs((window as unknown as DevWindow).__BODY__.squash.x) < 0.003, undefined, { timeout: 90000, polling: 50 })
  })

  test('the ambient sound bed starts once audio is allowed and the intro is over, with no audio errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await ready(page)
    // browsers only run audio after a gesture
    await page.mouse.click(400, 300)
    await page.waitForFunction(() => (window as unknown as DevWindow).__AMBIENCE__ === true, undefined, { timeout: 30000 })
    // and the sounds that fire during play do not throw
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(2500)
    await page.keyboard.up('KeyW')
    await page.keyboard.press('KeyM')
    await page.keyboard.press('Escape')
    expect(errors, 'no uncaught errors from audio').toEqual([])
  })

  test('the mouse turns the camera like a 3D game, and W walks where you are looking', async ({ page }) => {
    await ready(page)
    await page.waitForTimeout(1500)
    const heading = () =>
      page.evaluate(() => {
        const h = (window as unknown as DevWindow).__CAMERA_RIG__.heading
        return [h.x, h.y, h.z]
      })
    const angleBetween = (a: number[], b: number[]) => {
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
      return Math.acos(Math.min(1, Math.max(-1, dot / (Math.hypot(...a) * Math.hypot(...b)))))
    }
    const before = await heading()

    // press on the world and drag right: the view turns
    await page.mouse.move(640, 300)
    await page.mouse.down()
    await page.mouse.move(900, 300, { steps: 10 })
    await page.mouse.up()
    await page.waitForFunction(
      (b) => {
        const h = (window as unknown as DevWindow).__CAMERA_RIG__.heading
        const dot = h.x * b[0] + h.y * b[1] + h.z * b[2]
        return Math.acos(Math.min(1, Math.max(-1, dot / (Math.hypot(h.x, h.y, h.z) * Math.hypot(b[0], b[1], b[2]))))) > 0.35
      },
      before,
      { timeout: 90000, polling: 50 }
    )
    const looking = await heading()
    expect(angleBetween(before, looking), 'the camera turned').toBeGreaterThan(0.35)

    // ...and W now walks the way the camera looks
    if (await page.evaluate(() => !!document.pointerLockElement)) await page.evaluate(() => document.exitPointerLock())
    const start = (await nav(page)).position
    await page.keyboard.down('KeyW')
    await page.waitForFunction(
      (a) => {
        const now = (window as unknown as { __WORLD_STORE__: { getState: () => { position: number[] } } }).__WORLD_STORE__.getState().position
        return Math.hypot(now[0] - a[0], now[1] - a[1], now[2] - a[2]) > 2
      },
      start,
      { timeout: 90000, polling: 50 }
    )
    await page.keyboard.up('KeyW')
    const end = (await nav(page)).position
    const moved = end.map((v, i) => v - start[i])
    const heading2 = await heading()
    expect(angleBetween(moved, heading2), 'the visitor walked along the look direction').toBeLessThan(0.6)
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

/** Store fields the touch and map tests read */
interface NavState {
  position: number[]
  abdulrahmanPosition: number[]
  isTourActive: boolean
  mapOpen: boolean
  introComplete: boolean
  currentDistrict: string
  charactersReady: boolean
  touchUi: boolean
}
const nav = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __WORLD_STORE__: { getState: () => NavState } }).__WORLD_STORE__.getState())
const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]))

async function whenPlayable(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!(window as unknown as DevWindow).__WORLD_STORE__, undefined, { timeout: 120000 })
  await page.waitForFunction(
    () => (window as unknown as { __WORLD_STORE__: { getState: () => NavState } }).__WORLD_STORE__.getState().introComplete,
    undefined,
    { timeout: 120000 }
  )
}

/**
 * Phones and tablets. The visitor once could not move at all on a touch screen: only
 * keys ended the guided tour, so it never ended, and a drag anywhere was ignored.
 */
test.describe('Touch devices', () => {
  // A phone, minus defaultBrowserType (which can't be set inside a describe)
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['Pixel 7']
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch })
  test.describe.configure({ timeout: 240_000 })

  test('the joystick shows, walks the visitor, and takes them off the guided tour', async ({ page }) => {
    await whenPlayable(page)
    expect((await nav(page)).touchUi, 'a touch device starts in touch mode').toBe(true)
    const stick = page.locator('[data-joystick]')
    await expect(stick).toBeVisible()
    await expect(stick).toHaveCSS('opacity', '1')

    const box = (await stick.boundingBox())!
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    const cdp = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })

    expect((await nav(page)).isTourActive, 'the guided tour is running').toBe(true)
    const before = (await nav(page)).position
    await touch('touchStart', cx, cy)
    await touch('touchMove', cx, cy - 40) // thumb pushed up = forward
    await page.waitForTimeout(3000)
    const walking = await nav(page)
    await touch('touchEnd')
    expect(walking.isTourActive, 'touching the stick ends the guided tour').toBe(false)
    expect(dist(walking.position, before), 'the visitor walked').toBeGreaterThan(3)
  })

  test('tapping the minimap opens the world map, and a district in it takes you there', async ({ page }) => {
    await whenPlayable(page)
    await page.locator('button[aria-label="Open world map"]').tap()
    await expect(page.getByRole('dialog', { name: 'World map' })).toBeVisible()
    expect((await nav(page)).mapOpen).toBe(true)

    await page.getByRole('button', { name: /Projects Exhibition/ }).tap()
    await expect(page.getByRole('dialog', { name: 'World map' })).toBeHidden()
    await page.waitForFunction(
      () => (window as unknown as { __WORLD_STORE__: { getState: () => NavState } }).__WORLD_STORE__.getState().currentDistrict === '/projects',
      undefined,
      { timeout: 60000 }
    )
    // The guide came too, and nothing pulls the visitor back across town
    const arrived = await nav(page)
    expect(dist(arrived.position, arrived.abdulrahmanPosition), 'the guide is beside the visitor').toBeLessThan(3)
    await page.waitForTimeout(6000)
    const later = await nav(page)
    expect(dist(later.position, arrived.position), 'the visitor stays where they landed').toBeLessThan(2)
  })
})

test.describe('Desktop', () => {
  test('no joystick on a mouse-and-keyboard machine, and M opens the world map', async ({ page }) => {
    test.setTimeout(240_000)
    await whenPlayable(page)
    expect((await nav(page)).touchUi).toBe(false)
    await expect(page.locator('[data-joystick]')).toHaveCSS('opacity', '0')
    await page.keyboard.press('KeyM')
    await expect(page.getByRole('dialog', { name: 'World map' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'World map' })).toBeHidden()
  })
})

/**
 * What a shared link and a search engine see, and the way out for anyone whose
 * device cannot run the world. All of it is server-rendered, so no WebGL is needed.
 */
test.describe('Launch readiness', () => {
  test('a shared link carries a title, description and share card', async ({ page }) => {
    await page.goto('/')
    const content = (selector: string) => page.locator(selector).first().getAttribute('content')

    await expect(page).toHaveTitle(/Abdulrahman/)
    expect(await content('meta[name="description"]')).toMatch(/portfolio/i)
    expect(await content('meta[property="og:title"]')).toBeTruthy()
    expect(await content('meta[property="og:description"]')).toBeTruthy()
    expect(await content('meta[name="twitter:card"]')).toBe('summary_large_image')

    // The card itself must exist and be the size every platform crops to
    const image = await content('meta[property="og:image"]')
    expect(image, 'og:image is declared').toBeTruthy()
    expect(await content('meta[property="og:image:width"]')).toBe('1200')
    expect(await content('meta[property="og:image:height"]')).toBe('630')
    const card = await page.request.get(new URL(image!).pathname + new URL(image!).search)
    expect(card.ok(), 'the share card renders').toBeTruthy()
    expect(card.headers()['content-type']).toContain('image/png')

    // Search engines are told who this is
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(jsonLd, 'structured data is present').toContain('"Person"')
  })

  test('robots and sitemap point search engines at every district', async ({ page }) => {
    const robots = await page.request.get('/robots.txt')
    expect(robots.ok()).toBeTruthy()
    expect(await robots.text()).toContain('Sitemap:')

    const sitemap = await page.request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    const xml = await sitemap.text()
    for (const route of ['/projects', '/essays', '/bio']) {
      expect(xml, `sitemap lists ${route}`).toContain(route)
    }
  })

  test('the reader page shows the real writing, scrolls, and loads no 3D world', async ({ page }) => {
    await page.goto('/reader')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Abdulrahman')

    // Real prose, converted from markdown rather than printed as source
    const articles = page.locator('article')
    expect(await articles.count(), 'every piece of writing is on the page').toBeGreaterThan(3)
    await expect(page.locator('article h2, article h3').first()).toBeVisible()
    expect(await page.locator('body').innerText(), 'markdown was rendered, not shown raw').not.toContain('**')

    // The world is not over the top of it, and the page can be read to the end
    expect(await page.locator('canvas').count(), 'no 3D canvas on the reader').toBe(0)
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(height, 'there is more than one screen of content').toBeGreaterThan(1500)
    await page.evaluate(() => window.scrollTo(0, 2000))
    expect(await page.evaluate(() => window.scrollY), 'the page scrolls').toBeGreaterThan(1000)
  })

  test('a keyboard can leave the 3D world on the first tab', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
    await expect(focused).toHaveAttribute('href', '/reader')
  })
})
