import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const SITE_URL = 'https://babthedev.com'
const CONTENT_ROOT = path.join(process.cwd(), 'src/content')
const OUTPUT_PATH = path.join(process.cwd(), 'public/feed.xml')

interface FeedItem {
  title: string
  date: string
  slug: string
  folder: string
  description?: string
  content: string
}

console.log('--- Generating RSS 2.0 feed (`public/feed.xml`) ---')

const items: FeedItem[] = []

for (const folder of ['essays', 'projects']) {
  const dir = path.join(CONTENT_ROOT, folder)
  if (!fs.existsSync(dir)) continue

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    const fullPath = path.join(dir, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(raw)

    items.push({
      title: data.title ?? slug,
      date: data.date ?? '2026-01-01',
      slug,
      folder,
      description: data.description ?? data.category ?? '',
      content,
    })
  }
}

// Sort descending by date
items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Abdulrahman's Hub — Essays &amp; Projects</title>
    <link>${SITE_URL}</link>
    <description>A spatial brutalist representation of Abdulrahman's work, ideas, and architecture.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${SITE_URL}/${item.folder === 'essays' ? 'essays' : 'projects'}#${item.slug}</link>
      <guid>${SITE_URL}/${item.folder}/${item.slug}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escapeXml(item.description || item.title)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`

fs.writeFileSync(OUTPUT_PATH, rssXml, 'utf8')
console.log(`✓ RSS feed successfully generated at public/feed.xml (${items.length} items)`)
