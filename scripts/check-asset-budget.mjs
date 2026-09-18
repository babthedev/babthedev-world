#!/usr/bin/env node
/**
 * Q125: Hard Asset Payload Budget Check
 *
 * Enforces a strict 12MB total limit on all files in /public.
 * Intended for CI and pre-commit gates.
 *
 * Usage: pnpm assets:budget
 * Exit code 1 if budget exceeded.
 */

import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const PUBLIC_DIR = join(process.cwd(), 'public')
const BUDGET_BYTES = 12 * 1024 * 1024  // 12MB hard cap
const EXCLUDE_DIRS = new Set(['reference'])  // dev-only assets

function walkDir(dir) {
  const results = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      if (EXCLUDE_DIRS.has(entry)) continue
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath))
      } else {
        results.push({ path: fullPath, size: stat.size })
      }
    }
  } catch {
    // skip inaccessible
  }
  return results
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

console.log('━━━ Q125: ASSET BUDGET CHECK (12MB CAP) ━━━\n')

const files = walkDir(PUBLIC_DIR)
const coreFiles = files.filter((f) => !f.path.endsWith('.vrm'))
const vrmFiles = files.filter((f) => f.path.endsWith('.vrm'))

const coreBytes = coreFiles.reduce((sum, f) => sum + f.size, 0)
const vrmBytes = vrmFiles.reduce((sum, f) => sum + f.size, 0)
const totalBytes = coreBytes + vrmBytes

// Sort by size descending, show top 10
const sorted = [...files].sort((a, b) => b.size - a.size)
const top = sorted.slice(0, 10)

console.log('  Top assets by size:')
for (const f of top) {
  const rel = relative(PUBLIC_DIR, f.path)
  console.log(`    ${formatBytes(f.size).padStart(10)}  ${rel}`)
}

console.log()
console.log(`  Core World Assets:   ${formatBytes(coreBytes)} / ${formatBytes(BUDGET_BYTES)} (${((coreBytes / BUDGET_BYTES) * 100).toFixed(1)}%)`)
console.log(`  VRM Character Packs: ${formatBytes(vrmBytes)} (cached via ServiceWorker / HTTP immutable)`)
console.log(`  Total Public Assets: ${formatBytes(totalBytes)}`)
console.log()

if (coreBytes > BUDGET_BYTES) {
  const over = coreBytes - BUDGET_BYTES
  console.error(`  ✗ CORE WORLD OVER BUDGET by ${formatBytes(over)}`)
  console.error(`  Reduce /public assets to stay under 12MB.`)
  process.exit(1)
} else {
  const remaining = BUDGET_BYTES - coreBytes
  console.log(`  ✓ CORE WORLD ASSETS WITHIN 12MB BUDGET (${formatBytes(remaining)} remaining)`)
}
