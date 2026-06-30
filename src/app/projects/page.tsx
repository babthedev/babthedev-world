import { getMdxContent } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default function ProjectsPage() {
  const projects = getMdxContent('projects');

  return (
    <main className="w-full h-full relative pointer-events-none">
      <div className="absolute bottom-10 left-10 pointer-events-auto bg-black/80 p-8 border border-white/10 w-[600px] max-h-[70vh] overflow-y-auto">
        <h1 className="text-4xl font-merriweather text-white font-bold mb-8">
          Projects Exhibition
        </h1>
        <div className="space-y-12">
          {projects.map((project) => (
            <article key={project.slug} className="prose prose-invert prose-p:font-inter prose-headings:font-merriweather">
              <MDXRemote source={project.content} />
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
