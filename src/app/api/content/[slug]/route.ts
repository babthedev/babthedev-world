import { NextRequest, NextResponse } from 'next/server'
import { serialize } from 'next-mdx-remote/serialize'
import { getMdxContent } from '@/lib/mdx'

const FOLDERS = ['bio', 'projects', 'essays']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Search across all content folders for a matching slug
  for (const folder of FOLDERS) {
    const items = getMdxContent(folder)
    const match = items.find((item) => item.slug === slug)

    if (match) {
      const mdxSource = await serialize(match.content, {
        parseFrontmatter: false,
      })

      return NextResponse.json({
        found: true,
        source: mdxSource,
        frontmatter: match.frontmatter,
        folder,
      })
    }
  }

  return NextResponse.json({ found: false }, { status: 404 })
}