import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="fixed inset-0 bg-[#F2F1EC] flex items-center justify-center p-6 text-black select-none">
      <div className="max-w-md w-full border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
          Error 404 // Out of Bounds
        </div>
        <h1 className="font-merriweather text-3xl font-bold mb-4">
          Dead End
        </h1>
        <p className="font-inter text-sm text-black/80 leading-relaxed mb-6">
          This sector does not exist on the map. The roads end here.
        </p>
        <Link
          href="/"
          className="inline-block border-2 border-black bg-black text-white px-5 py-2.5 font-mono text-xs tracking-wider uppercase hover:bg-white hover:text-black transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          Return to Hub →
        </Link>
      </div>
    </main>
  )
}
