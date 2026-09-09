import { getMdxContent } from '@/lib/mdx'

export default function BioPage() {
  const bioFiles = getMdxContent('bio')
  const bio = bioFiles.length > 0 ? bioFiles[0] : null

  // sr-only fallback — actual visible rendering happens in
  // ReadingPanel.tsx via /api/content/[slug], triggered by
  // walking into this district or interacting with the cafe table prop.
  return (
    <main>
      <h1>Welcome Terrace</h1>
      {bio ? (
        <article dangerouslySetInnerHTML={{ __html: bio.content }} />
      ) : (
        <p>Content loading.</p>
      )}
    </main>
  )
}