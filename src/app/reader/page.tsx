import type { Metadata } from 'next'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMdxContent } from '@/lib/mdx'
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Reader',
  description: `Everything in ${SITE_NAME} as plain text: ${SITE_DESCRIPTION}`,
  alternates: { canonical: '/reader' },
  openGraph: {
    title: `Reader — ${SITE_NAME}`,
    description: 'The whole portfolio as text, for reading without the 3D world.',
    url: '/reader',
  },
}

interface Frontmatter {
  title: string
  date?: string
  role?: string
  location?: string
  category?: string
  description?: string
  url?: string
}

const readable = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : null

/**
 * Each piece of writing already has its title rendered above it, and the page has one h1.
 * Markdown headings inside the body are therefore shifted down a level, so the document
 * keeps a single top-level heading and an outline that follows the page, not the file.
 */
const PROSE_HEADINGS = {
  h1: (props: React.ComponentProps<'h2'>) => <h2 {...props} />,
  h2: (props: React.ComponentProps<'h3'>) => <h3 {...props} />,
  h3: (props: React.ComponentProps<'h4'>) => <h4 {...props} />,
}

function Prose({ source }: { source: string }) {
  return (
    <div
      className="[&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-black [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-black/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:font-sans [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-sans [&_h3]:text-lg [&_h3]:font-bold [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-sans [&_h4]:text-base [&_h4]:font-bold [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p]:leading-relaxed [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:border-2 [&_pre]:border-black [&_pre]:bg-[#F7F6F2] [&_pre]:p-4 [&_strong]:font-bold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
    >
      <MDXRemote source={source} components={PROSE_HEADINGS} />
    </div>
  )
}

function Section({
  id,
  heading,
  blurb,
  items,
}: {
  id: string
  heading: string
  blurb: string
  items: { slug: string; frontmatter: Frontmatter; content: string }[]
}) {
  if (items.length === 0) return null
  return (
    <section id={id} className="mt-16 scroll-mt-6">
      <h2 className="border-b-4 border-black pb-2 font-sans text-4xl font-black uppercase tracking-tight">{heading}</h2>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-black/50">{blurb}</p>
      {items.map((item) => {
        const { title, date, category, role, location, url } = item.frontmatter
        const meta = [category, role, location, readable(date)].filter(Boolean).join('  ·  ')
        return (
          <article
            key={item.slug}
            id={item.slug}
            className="mt-8 scroll-mt-6 border-2 border-black bg-white p-6 shadow-[5px_5px_0_0_#0B0B0B] md:p-8"
          >
            <h3 className="font-sans text-2xl font-black tracking-tight">{title}</h3>
            {meta && <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-black/50">{meta}</p>}
            {url && (
              <p className="mt-2 font-mono text-xs">
                <a href={url} className="underline decoration-2 underline-offset-2" rel="noopener noreferrer" target="_blank">
                  {url.replace(/^https?:\/\//, '')} ↗
                </a>
              </p>
            )}
            <div className="mt-5 border-t-2 border-black/10 pt-5">
              <Prose source={item.content} />
            </div>
          </article>
        )
      })}
    </section>
  )
}

/**
 * The whole portfolio as text.
 *
 * The world needs WebGL, and not every visitor has it: old phones, locked-down
 * browsers, a crashed graphics context, or simply someone who would rather read.
 * This page is the same content, plainly laid out, and needs nothing but HTML.
 */
export default function ReaderPage() {
  const bio = getMdxContent<Frontmatter>('bio')
  const projects = getMdxContent<Frontmatter>('projects')
  const essays = getMdxContent<Frontmatter>('essays')

  const byNewest = (a: { frontmatter: Frontmatter }, b: { frontmatter: Frontmatter }) =>
    (b.frontmatter.date ?? '').localeCompare(a.frontmatter.date ?? '')

  return (
    <main id="reader-page" className="min-h-screen bg-[#F3F2ED] px-5 py-12 text-[#0B0B0B] md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b-4 border-black pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/50">Reader</p>
          <h1 className="mt-3 font-sans text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            {AUTHOR}
          </h1>
          <p className="mt-5 max-w-xl font-sans text-lg leading-relaxed text-black/70">{SITE_DESCRIPTION}</p>
          <nav className="mt-7 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-widest">
            <Link
              href="/"
              className="border-2 border-black bg-black px-4 py-2.5 text-[#F3F2ED] transition-colors hover:bg-[#F3F2ED] hover:text-black"
            >
              Enter the world →
            </Link>
            {[
              ['About', 'about'],
              ['Projects', 'projects'],
              ['Essays', 'essays'],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} className="border-2 border-black px-4 py-2.5 transition-colors hover:bg-black hover:text-[#F3F2ED]">
                {label}
              </a>
            ))}
            <a
              href="/resume.pdf"
              className="border-2 border-black px-4 py-2.5 transition-colors hover:bg-black hover:text-[#F3F2ED]"
            >
              Résumé ↗
            </a>
          </nav>
        </header>

        <Section id="about" heading="About" blurb="Who I am and what I work on" items={bio} />
        <Section id="projects" heading="Projects" blurb="Things I have built" items={[...projects].sort(byNewest)} />
        <Section id="essays" heading="Essays" blurb="Writing on systems and craft" items={[...essays].sort(byNewest)} />

        <footer className="mt-20 border-t-4 border-black pt-6 font-mono text-xs uppercase tracking-widest text-black/50">
          <p>
            {AUTHOR} ·{' '}
            <Link href="/" className="underline decoration-2 underline-offset-2 hover:text-black">
              The interactive world
            </Link>{' '}
            ·{' '}
            <a href="/feed.xml" className="underline decoration-2 underline-offset-2 hover:text-black">
              RSS
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
