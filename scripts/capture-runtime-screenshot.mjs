import { chromium } from '@playwright/test'
import { join } from 'node:path'

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-unsafe-webgl',
    ],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })
  const page = await context.newPage()

  const consoleLogs = []
  page.on('console', (msg) => {
    const text = `[BROWSER_${msg.type()}] ${msg.text()}`
    consoleLogs.push(text)
    console.log(text)
  })
  page.on('pageerror', (err) => {
    console.error(`[PAGE_ERROR] ${err.message}\n${err.stack}`)
  })
  page.on('requestfailed', (req) => {
    console.error(`[REQUEST_FAILED] ${req.url()} (${req.failure()?.errorText})`)
  })
  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.error(`[HTTP_${res.status()}] ${res.url()}`)
    }
  })

  console.log('Navigating to http://localhost:3004...')
  await page.goto('http://localhost:3004', { waitUntil: 'domcontentloaded', timeout: 30000 })

  console.log('Waiting for 3D world to load and mount (> 20 meshes)...')
  await page.waitForFunction(() => {
    const scene = window.__THREE_SCENE__
    if (!scene) return false
    let count = 0
    scene.traverse((o) => { if (o.isMesh) count++ })
    return count > 20
  }, { timeout: 60000 })

  console.log('World loaded! Dismissing intro dialogue...')
  await page.evaluate(() => {
    if (window.__WORLD_STORE__) {
      window.__WORLD_STORE__.getState().setIntroComplete(true)
    }
  })

  // Wait 1.5 seconds for intro dialogue fade-out and camera stabilization
  await page.waitForTimeout(1500)

  // Extract Next.js dev overlay error if present
  const nextError = await page.evaluate(() => {
    const portal = document.querySelector('nextjs-portal')
    if (portal && portal.shadowRoot) {
      const dialog = portal.shadowRoot.querySelector('[data-nextjs-dialog]')
      if (dialog) return dialog.textContent
    }
    const fallbackDialog = document.querySelector('[data-nextjs-dialog]')
    return fallbackDialog ? fallbackDialog.textContent : null
  })
  if (nextError) {
    console.error('--- NEXT.JS RUNTIME ERROR ---', nextError)
  }

  // Evaluate WebGL / Canvas status in page context
  const sceneInfo = await page.evaluate(() => {
    const storeState = window.__WORLD_STORE__ ? {
      position: window.__WORLD_STORE__.getState().position,
      abdulrahmanPosition: window.__WORLD_STORE__.getState().abdulrahmanPosition,
      introComplete: window.__WORLD_STORE__.getState().introComplete,
      isTourActive: window.__WORLD_STORE__.getState().isTourActive,
    } : null

    const canvas = document.querySelector('canvas')
    if (!canvas) return { error: 'No canvas found', storeState }
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const canvasKeys = Object.keys(canvas)

    const cam = window.__THREE_CAMERA__
    const threeScene = window.__THREE_SCENE__

    let visitorNDC = null
    let abdulNDC = null
    if (cam) {
      const vVis = cam.position.clone().set(0, 26, 0).project(cam)
      visitorNDC = [vVis.x, vVis.y, vVis.z]
      const vAbd = cam.position.clone().set(0.7, 26, 0).project(cam)
      abdulNDC = [vAbd.x, vAbd.y, vAbd.z]
    }

    const sceneObjects = []
    if (threeScene && cam) {
      const scratch = cam.position.clone()
      threeScene.traverse((obj) => {
        if (obj.isMesh || obj.type === 'SkinnedMesh' || obj.name === 'visitor' || obj.name === 'abdulrahman' || obj.name === 'ground') {
          obj.getWorldPosition(scratch)
          sceneObjects.push({
            name: obj.name || obj.type,
            type: obj.type,
            visible: obj.visible,
            worldPos: [scratch.x, scratch.y, scratch.z],
          })
        }
      })
    }

    const threeInfo = {
      camPos: cam ? [cam.position.x, cam.position.y, cam.position.z] : null,
      camUp: cam ? [cam.up.x, cam.up.y, cam.up.z] : null,
      camRot: cam ? [cam.rotation.x, cam.rotation.y, cam.rotation.z] : null,
      camFov: cam?.fov,
      visitorNDC,
      abdulNDC,
      sceneObjectsCount: sceneObjects.length,
      sceneObjects: sceneObjects.slice(0, 30),
    }

    let centerPixel = null
    if (gl) {
      const pixels = new Uint8Array(4)
      gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      centerPixel = [pixels[0], pixels[1], pixels[2], pixels[3]]
    }

    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      hasGL: !!gl,
      canvasKeys,
      centerPixel,
      storeState,
      threeInfo,
    }
  })
  console.log('\n--- SCENE & CAMERA INFO ---', JSON.stringify(sceneInfo, null, 2))

  const screenshotPath = join(process.cwd(), 'runtime-capture.png')
  await page.screenshot({ path: screenshotPath })
  console.log(`Screenshot saved to ${screenshotPath}`)

  console.log('\n--- BROWSER CONSOLE LOGS ---')
  for (const log of consoleLogs) {
    console.log(log)
  }

  await browser.close()
}

run().catch((e) => {
  console.error('Capture failed:', e)
  process.exit(1)
})
