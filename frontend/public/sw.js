/**
 * GradeFlow Network & Offline Service Worker
 *
 * Provides safe, Network-First fallback protection against browser "Site can't be reached"
 * errors caused by campus/college Wi-Fi firewalls, DNS blocks, or network disconnects.
 *
 * Safety & Freshness Guarantees:
 * 1. Strictly Network-First for navigation: Always attempts live server first.
 * 2. ONLY serves offline.html when a navigation request fails completely.
 * 3. Never caches dynamic API routes, auth endpoints, or realtime streams.
 * 4. Immediate activation via skipWaiting() and clients.claim().
 */

const CACHE_NAME = 'gf-offline-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/webisteLogo.png',
  '/favicon.svg',
];

// Pre-cache the standalone fallback screen on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Clean up any legacy caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept failed page navigations and serve offline.html
self.addEventListener('fetch', (event) => {
  // Only intercept HTML page navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse || Response.error();
      })
    );
    return;
  }

  // Never intercept API requests, authentication, Ably, or WebSockets
  const url = event.request.url;
  if (
    url.includes('/api/') ||
    url.includes('/auth/') ||
    url.includes('ably.io') ||
    url.includes('socket.io')
  ) {
    return;
  }
});
