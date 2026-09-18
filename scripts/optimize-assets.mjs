#!/usr/bin/env node
/**
 * Q121: Asset Optimization Pipeline
 *
 * Applies prune, dedup, and meshopt compression across all GLB/GLTF models
 * in public/ to produce optimized production builds.
 *
 * Usage: pnpm assets:optimize
 * Requires: @gltf-transform/cli (devDependency)
 */

import { execSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const PUBLIC_DIR = join(process.cwd(), 'public')
const EXTENSIONS = new Set(['.glb', '.gltf'])

function findModels(dir) {
  const results = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        results.push(...findModels(fullPath))
      } else if (EXTENSIONS.has(extname(entry).toLowerCase())) {
        results.push(fullPath)
      }
    }
  } catch {
    // skip inaccessible directories
  }
  return results
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

console.log('━━━ Q121: ASSET OPTIMIZATION PIPELINE ━━━\n')

const models = findModels(PUBLIC_DIR)

if (models.length === 0) {
  console.log('No GLB/GLTF models found in public/')
  process.exit(0)
}

console.log(`Found ${models.length} model(s):\n`)

let totalBefore = 0
let totalAfter = 0
let errors = 0

for (const modelPath of models) {
  const name = basename(modelPath)
  const beforeSize = statSync(modelPath).size
  totalBefore += beforeSize

  console.log(`  ▸ ${name} (${formatBytes(beforeSize)})`)

  try {
    // Run gltf-transform optimize pipeline:
    // 1. prune — remove unused nodes, meshes, materials, textures
    // 2. dedup — deduplicate accessors, textures, materials
    // 3. quantize — quantize mesh attributes to reduce size
    execSync(
      `npx --yes @gltf-transform/cli optimize "${modelPath}" "${modelPath}" --compress meshopt`,
      { stdio: 'pipe', timeout: 60_000 }
    )

    const afterSize = statSync(modelPath).size
    totalAfter += afterSize
    const savings = ((1 - afterSize / beforeSize) * 100).toFixed(1)
    console.log(`    ✓ ${formatBytes(afterSize)} (${savings}% saved)\n`)
  } catch (err) {
    errors++
    totalAfter += beforeSize
    console.log(`    ✗ Optimization failed: ${err.message}\n`)
  }
}

console.log('━━━ SUMMARY ━━━')
console.log(`  Before: ${formatBytes(totalBefore)}`)
console.log(`  After:  ${formatBytes(totalAfter)}`)
console.log(`  Saved:  ${formatBytes(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`)
if (errors > 0) console.log(`  Errors: ${errors}`)
console.log()
