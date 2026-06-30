import { getMdxContent } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default function EssaysPage() {
  const essays = getMdxContent('essays');

  return (
    <main className="w-full h-full relative pointer-events-none">
      <div className="absolute top-1/2 right-10 -translate-y-1/2 pointer-events-auto text-right bg-black/80 p-8 border border-white/10 w-[600px] max-h-[70vh] overflow-y-auto">
        <h1 className="text-4xl font-merriweather text-white font-bold mb-8">
          The Essays
        </h1>
        <div className="space-y-16">
          {essays.map((essay) => (
            <article key={essay.slug} className="prose prose-invert prose-p:font-inter prose-headings:font-merriweather text-left ml-auto">
              <MDXRemote source={essay.content} />
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
