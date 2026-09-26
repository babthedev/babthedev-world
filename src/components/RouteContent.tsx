'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Route content sits under the 3D world, which covers the screen, so on world routes it
 * is there for screen readers and crawlers rather than for looking at. The reader route
 * has no world over it, so its page is shown normally.
 */
export default function RouteContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDocument = pathname === '/reader'

  // The world locks the viewport to one non-scrolling screen; a document page must scroll.
  useEffect(() => {
    const target = [document.documentElement, document.body]
    for (const el of target) el.classList.toggle('is-document', isDocument)
    return () => {
      for (const el of target) el.classList.remove('is-document')
    }
  }, [isDocument])

  if (isDocument) return <>{children}</>
  return <div className="sr-only">{children}</div>
}
