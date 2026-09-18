'use client'

import { useEffect } from 'react'

/**
 * Q99: Registers the offline and 3D asset caching Service Worker
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.info('[SW] Service Worker active, scope:', reg.scope)
        })
        .catch((err) => {
          console.warn('[SW] Service Worker registration failed:', err)
        })
    }
  }, [])

  return null
}
