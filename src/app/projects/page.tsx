import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects Exhibition',
  description: 'Case studies from the exhibition district: what Abdulrahman Bello built, and how each piece works.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Projects Exhibition',
    description: 'Case studies from the exhibition district: what Abdulrahman Bello built, and how each piece works.',
    url: '/projects',
  },
}

import { getMdxContent } from '@/lib/mdx'

export default function ProjectsPage() {
  const projects = getMdxContent('projects')

  return (
    <main>
      <h1>Projects Exhibition</h1>
      {projects.map((project) => (
        <article key={project.slug}>
          <h2>{project.frontmatter.title}</h2>
        </article>
      ))}
    </main>
  )
}