import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { validateFrontmatter } from '../src/lib/contentSchemas'

const CONTENT_ROOT = path.join(process.cwd(), 'src/content')
const FOLDERS = ['essays', 'projects', 'bio']

console.log('--- Validating all MDX frontmatter with Zod ---')
let totalFiles = 0

for (const folder of FOLDERS) {
  const dir = path.join(CONTENT_ROOT, folder)
  if (!fs.existsSync(dir)) continue

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  for (const file of files) {
    totalFiles++
    const slug = file.replace(/\.mdx$/, '')
    const fullPath = path.join(dir, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { data } = matter(raw)

    try {
      const validated: any = validateFrontmatter(folder, slug, data)
      console.log(`✓ [${folder}] ${slug}: "${validated.title}" valid`)
    } catch (err: any) {
      console.error(`✗ Validation failed for ${folder}/${file}:`)
      console.error(err.message)
      process.exit(1)
    }
  }
}

console.log(`✓ All ${totalFiles} MDX content files strictly validated against Zod schemas!`)
