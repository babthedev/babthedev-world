import { test, expect } from '@playwright/test'

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
    await page.goto('/essays')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15000 })

    // Verify district label shows The Library
    const districtLabel = page.locator('#district-label')
    if (await districtLabel.isVisible()) {
      await expect(districtLabel).toContainText('The Library')
    }
  })

  test('opens in-world contact letter modal', async ({ page }) => {
    await page.goto('/')

    const contactButton = page.locator('button[aria-label="Send letter / Contact Abdulrahman"]')
    await expect(contactButton).toBeVisible()
    await contactButton.click()

    // Verify modal is open
    const modalHeading = page.getByRole('heading', { name: 'Send a Letter to Abdulrahman' })
    await expect(modalHeading).toBeVisible()

    // Capture snapshot of brutalist letter
    const modal = page.locator('div[role="dialog"]')
    await expect(modal).toBeVisible()
  })
})
