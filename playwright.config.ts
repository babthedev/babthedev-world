import { defineConfig, devices } from '@playwright/test'

/**
 * Q83: Visual Regression Testing Configuration
 * Configures Playwright to capture pixel-diff snapshots of the
 * WebGL canvas and monochrome brutalist UI views.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3004',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    // Enable WebGL in headless Chrome
    launchOptions: {
      args: [
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--use-gl=angle',
        '--use-angle=default',
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
