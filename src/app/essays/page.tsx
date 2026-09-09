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