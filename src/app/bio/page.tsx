import { getMdxContent } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default function BioPage() {
  const bioFiles = getMdxContent('bio');
  const bio = bioFiles.length > 0 ? bioFiles[0] : null;

  return (
    <main className="w-full h-full relative pointer-events-none">
      <div className="absolute top-10 right-10 text-right pointer-events-auto bg-black/80 p-8 border border-white/10 w-[500px] h-[calc(100vh-80px)] overflow-y-auto">
        <h1 className="text-4xl font-merriweather text-white font-bold mb-8">
          Welcome Terrace
        </h1>
        {bio ? (
          <article className="prose prose-invert prose-p:font-inter prose-headings:font-merriweather text-left">
            <MDXRemote source={bio.content} />
          </article>
        ) : (
          <p className="text-gray-400">Content loading...</p>
        )}
      </div>
    </main>
  );
}
