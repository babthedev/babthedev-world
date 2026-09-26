/**
 * BabWorld Service Worker — Offline & Repeat Visit Acceleration (Q99)
 * - Cache-first / Stale-While-Revalidate for 3D GLBs, textures, and fonts.
 * - Network-first for pages and dynamic API routes.
 */

const CACHE_NAME = 'babworld-assets-v1'

const STATIC_PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/feed.xml',
  '/resume.pdf',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // One at a time, not addAll: addAll is atomic, so a single missing file
      // would silently leave the whole precache empty.
      return Promise.all(
        STATIC_PRECACHE.map((url) => cache.add(url).catch(() => {}))
      )
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept API routes or non-GET requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return
  }

  // 3D GLB models, VRM avatars, and fonts: Cache-first with Stale-While-Revalidate
  const is3DAsset =
    url.pathname.includes('/kenney/') ||
    url.pathname.endsWith('.glb') ||
    url.pathname.endsWith('.vrm') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png')

  if (is3DAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone())
              }
              return networkResponse
            })
            .catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // Default network-first with cache fallback for pages
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone)
          })
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})
