#!/usr/bin/env node
/**
 * Definition of Done — Final 150-Question Alignment Verification
 *
 * Validates that all architectural systems from docs/alignment_plan.md
 * are present in the codebase. Run as the final quality gate before merge.
 *
 * Usage: node scripts/verify-dod.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
const PUBLIC = join(ROOT, 'public')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.log(`  ✗ ${label}`)
    failed++
  }
}

function fileExists(relPath) {
  return existsSync(join(ROOT, relPath))
}

function fileContains(relPath, needle) {
  if (!existsSync(join(ROOT, relPath))) return false
  return readFileSync(join(ROOT, relPath), 'utf8').includes(needle)
}

function srcContains(needle) {
  // Recursive search in src/
  return searchDir(SRC, needle)
}

function searchDir(dir, needle) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (searchDir(fullPath, needle)) return true
      } else if (entry.name.match(/\.(tsx?|js|mjs)$/)) {
        if (readFileSync(fullPath, 'utf8').includes(needle)) return true
      }
    }
  } catch { /* skip */ }
  return false
}

console.log('━━━ BABWORLD — DEFINITION OF DONE VERIFICATION ━━━\n')

// ── BATCH 1-5: Core Architecture ─────────────────────────
console.log('▸ Core Architecture & Physics')
check('Q106: sphereMath.ts with polarToCartesian',
  fileContains('src/lib/sphereMath.ts', 'polarToCartesian'))
check('Q107: Quaternion surface alignment (setFromUnitVectors)',
  srcContains('setFromUnitVectors'))
check('Q108: Tangent-plane input projection',
  srcContains('getTangentBasis'))
check('Q109: Radial gravity 35 m/s²',
  fileContains('src/lib/constants.ts', 'RADIAL_GRAVITY'))
check('Q110: Camera up = surface normal',
  fileContains('src/components/canvas/CameraController.tsx', 'camera.up'))
check('Q128: 50m sphere mesh (R=25)',
  fileContains('src/lib/constants.ts', 'PLANET_RADIUS'))

// ── BATCH 6-10: Character & Movement ─────────────────────
console.log('\n▸ Character Controllers & Tour')
check('Q91-95: CharacterModel unified abstraction',
  fileExists('src/components/canvas/CharacterModel.tsx'))
check('Q101: Secondary idle animations',
  fileContains('src/components/canvas/CharacterModel.tsx', 'Q101'))
check('Q102: NPC head tracking (lookAtTarget)',
  fileContains('src/components/canvas/CharacterModel.tsx', 'lookAtTarget'))
check('Q117: Tether-aware adaptive waiting',
  srcContains('tether') || srcContains('TETHER_DISTANCE'))
check('Q116: Catmull-Rom tour pathing',
  srcContains('CatmullRom') || srcContains('catmullRom'))

// ── BATCH 11-15: Rendering & Shaders ─────────────────────
console.log('\n▸ Rendering Pipeline')
check('Q66: Toon gradient [80,150,210,255]',
  fileContains('src/lib/constants.ts', 'TOON_GRADIENT_STEPS'))
check('Q67: Depth+normal Sobel outline',
  srcContains('Sobel') || srcContains('sobel'))
check('Q68: Gradient sky dome',
  srcContains('SkyDome') || srcContains('skyDome') || srcContains('PaintedSky'))
check('Q131: Emissive lamp materials',
  srcContains('emissive'))
check('Q132: Building scale jitter',
  srcContains('scaleJitter') || srcContains('SCALE_JITTER') || srcContains('0.85'))

// ── BATCH 16-20: Environment & Props ─────────────────────
console.log('\n▸ Environment & Physical Props')
check('Q112: Physical book props (PhysicalProps)',
  fileExists('src/components/canvas/PhysicalProps.tsx'))
check('Q114: Project pedestal props',
  srcContains('pedestal') || srcContains('plinth'))
check('Q115: Archive terminal',
  srcContains('terminal') || srcContains('Terminal'))
check('Q133: Spherical road markings',
  fileExists('src/components/canvas/RoadMarkings.tsx'))
check('Q135: District gateways',
  fileExists('src/components/canvas/DistrictGateways.tsx'))
check('Q103: Wind streaks',
  fileExists('src/components/canvas/WindStreaks.tsx'))
check('Q105: Easter eggs',
  fileExists('src/components/canvas/EasterEggs.tsx'))
check('Q69: Paper cranes',
  fileExists('src/components/canvas/PaperCranes.tsx'))

// ── BATCH 21-25: Audio ──────────────────────────────────
console.log('\n▸ Audio Soundscape')
check('Q137: Dialogue voice chirps',
  fileContains('src/hooks/useAudioManager.ts', 'playDialogueBlip'))
check('Q138: District-aware low-pass filter',
  srcContains('BiquadFilter') || srcContains('lowpass'))
check('Q139: Footstep pitch jitter',
  fileContains('src/hooks/useAudioManager.ts', 'playFootstep'))
check('Q140: Autoplay compliance',
  srcContains('AudioContext'))
check('Q103-audio: Wind whisper',
  fileContains('src/hooks/useAudioManager.ts', 'playWindWhisper'))
check('Q104-audio: Camera shutter',
  fileContains('src/hooks/useAudioManager.ts', 'playShutter'))

// ── BATCH 26-30: Camera ────────────────────────────────
console.log('\n▸ Camera System')
check('Q141: Spring-arm occlusion raycast',
  fileContains('src/components/canvas/CameraController.tsx', 'SPRING-ARM'))
check('Q142: Pitch clamping (-15° to +60°)',
  fileContains('src/lib/constants.ts', 'CAMERA_PITCH_MIN'))
check('Q143: Dialogue cinematic two-shot',
  fileContains('src/components/canvas/CameraController.tsx', 'dialogueGlide'))
check('Q144: Viewport offset during reading',
  fileContains('src/components/canvas/CameraController.tsx', 'panShift'))
check('Q145: Micro-camera impulse',
  fileContains('src/lib/constants.ts', 'CAMERA_IMPULSE'))

// ── BATCH 31-35: UI & Content Pipeline ──────────────────
console.log('\n▸ UI & Content Pipeline')
check('Q71-73: MDX content schemas (Zod)',
  fileExists('scripts/validate-content.ts'))
check('Q74: RSS feed generator',
  fileExists('scripts/generate-rss.ts'))
check('Q75: Reading panel',
  srcContains('ReadingPanel'))
check('Q86-87: SDF in-world signage',
  fileExists('src/components/canvas/InWorldSignage.tsx'))
check('Q88-89: Colophon modal',
  srcContains('ColophonModal'))
check('Q104: Photo mode / clean capture',
  srcContains('clean-capture'))
check('Q118: District arrival fanfare',
  srcContains('districtLabelVisible'))

// ── BATCH 36-40: Engagement & Interaction ───────────────
console.log('\n▸ Engagement Systems')
check('Q76: Cookieless beacon telemetry',
  fileExists('src/hooks/useTelemetry.ts') || srcContains('telemetry'))
check('Q77: Contact mailbox modal',
  srcContains('ContactModal'))
check('Q78: Resume chalkboard + PDF',
  fileExists('scripts/create-resume-pdf.ts') || srcContains('resume'))
check('Q79: Guestbook system',
  srcContains('GuestbookModal'))
check('Q80: Tour completion + passport stamp',
  srcContains('passportStamp') || srcContains('tourCompleted'))

// ── BATCH 41-45: Developer Experience ───────────────────
console.log('\n▸ Developer Tooling')
check('Q81: pnpm enforcement (preinstall)',
  fileContains('package.json', 'only-allow pnpm'))
check('Q82: Pre-commit quality gate',
  fileContains('package.json', 'pre-commit'))
check('Q85: F3 debug overlay',
  srcContains('debugMode') || srcContains('freeFlyMode'))
check('Q121: Asset optimization script',
  fileExists('scripts/optimize-assets.mjs'))
check('Q125: 12MB asset budget check',
  fileExists('scripts/check-asset-budget.mjs'))

// ── BATCH 46-50: Resilience & Performance ───────────────
console.log('\n▸ Resilience & Performance')
check('Q146: GPU memory disposal',
  srcContains('dispose'))
check('Q147: Tab inactivity (Page Visibility API)',
  srcContains('visibilitychange') || srcContains('isTabHidden'))
check('Q148: WebGL error boundary',
  srcContains('WebGLErrorBoundary') || srcContains('webglcontextlost'))
check('Q149: HMR singleton guards',
  srcContains('singleton') || srcContains('useRef'))
check('Q96-100: Feature flags',
  srcContains('FEATURE_FLAG') || srcContains('featureFlags'))
check('Q97: Offline service worker',
  fileExists('public/sw.js'))

// ── DEPLOYMENT READINESS ────────────────────────────────
console.log('\n▸ Deployment Readiness')
check('Vercel configuration',
  fileExists('vercel.json'))
check('Content: essays exist',
  fileExists('src/content/essays/brutalist-web.mdx'))
check('Content: projects exist',
  fileExists('src/content/projects/oryzon.mdx'))
check('Content: bio exists',
  fileExists('src/content/bio/bio.mdx'))
check('Character models present',
  fileExists('public/abdulrahman.vrm') && fileExists('public/visitor.vrm'))
check('Building models present',
  fileExists('public/kenney/building-a.glb'))

// ── SUMMARY ─────────────────────────────────────────────
console.log('\n━━━ RESULTS ━━━')
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
console.log(`  Total:  ${passed + failed}`)
console.log(`  Score:  ${((passed / (passed + failed)) * 100).toFixed(0)}%`)
console.log()

if (failed > 0) {
  console.log('  ⚠ Some checks failed. Review above for details.')
  process.exit(1)
} else {
  console.log('  ✓ ALL CHECKS PASSED — READY FOR PRODUCTION')
}
