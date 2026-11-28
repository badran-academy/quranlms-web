// Offline-friendly cache: hashed static files are cached forever (fast repeat loads on a weak connection).
// The page shell is network-first with a cached fallback. Database data is never cached.
const V = 'v3'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
))
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url)
  if (r.method !== 'GET' || u.origin !== location.origin) return
  if (u.pathname.includes('/assets/')) {
    e.respondWith(caches.open(V).then(async (c) => {
      const hit = await c.match(r); if (hit) return hit
      const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res
    }))
  } else if (r.mode === 'navigate') {
    e.respondWith(fetch(r, { cache: 'no-store' }).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); return res }).catch(() => caches.match(r)))
  }
})
