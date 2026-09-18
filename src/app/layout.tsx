import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import GlobalCanvas from '@/components/GlobalCanvas'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
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
  title: "Abdulrahman's Hub",
  description:
    'A spatial representation of Abdulrahman\'s work, ideas, projects, and journey.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="antialiased font-sans">
        {/* GlobalCanvas now renders the world AND all 2D UI 
            (intro, HUD, reading panel, dialogue, etc.) — see File 23.
            {children} below is only used for route-level metadata
            and SSR fallback content; the actual visible experience
            is entirely inside GlobalCanvas. */}
        <GlobalCanvas />
        <ServiceWorkerRegistration />
        <div className="sr-only">{children}</div>
      </body>
    </html>
  )
}