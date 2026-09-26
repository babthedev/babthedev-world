import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import GlobalCanvas from '@/components/GlobalCanvas'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import RouteContent from '@/components/RouteContent'
import StructuredData from '@/components/StructuredData'
import { AUTHOR, KEYWORDS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
})

export const metadata: Metadata = {
  // Relative image and canonical paths below resolve against this
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Districts set their own title; this keeps the name on the end of it
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR, url: SITE_URL }],
  creator: AUTHOR,
  publisher: AUTHOR,
  keywords: [...KEYWORDS],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  category: 'technology',
}

/**
 * Ink on paper, so the browser chrome around the page matches it: the phone status bar,
 * the tab strip and the pull-to-refresh backdrop all take this colour.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F2ED' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0B' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        <StructuredData />
      </head>
      <body className="antialiased font-sans">
        {/* GlobalCanvas now renders the world AND all 2D UI 
            (intro, HUD, reading panel, dialogue, etc.) — see File 23.
            {children} below is only used for route-level metadata
            and SSR fallback content; the actual visible experience
            is entirely inside GlobalCanvas. */}
        {/* Reachable by keyboard before anything else: the world needs WebGL and a mouse,
            so the very first stop is the way out of it. Hidden until focused. */}
        <a
          href="/reader"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border-2 focus:border-black focus:bg-white focus:px-4 focus:py-3 focus:font-mono focus:text-sm focus:text-black focus:shadow-[4px_4px_0_0_#0B0B0B]"
        >
          Skip the 3D world — read as text
        </a>
        <GlobalCanvas />
        <ServiceWorkerRegistration />
        <RouteContent>{children}</RouteContent>
      </body>
    </html>
  )
}