import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Library',
  description: 'Essays and notes on systems, craft and the 3D web, read from the library district.',
  alternates: { canonical: '/essays' },
  openGraph: {
    title: 'The Library',
    description: 'Essays and notes on systems, craft and the 3D web, read from the library district.',
    url: '/essays',
  },
}

import { getMdxContent } from '@/lib/mdx'

export default function EssaysPage() {
  const essays = getMdxContent('essays')

  return (
    <main>
      <h1>The Library</h1>
      {essays.map((essay) => (
        <article key={essay.slug}>
          <h2>{essay.frontmatter.title}</h2>
        </article>
      ))}
    </main>
  )
}