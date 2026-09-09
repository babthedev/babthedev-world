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