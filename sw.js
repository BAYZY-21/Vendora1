/* ================================================================
   VENDORA — Service Worker v1.0.0
   مطور البرنامج: حارث حسيب السامرائي
   ================================================================ */

const CACHE_NAME = 'vendora-v1.0.0';
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js'
];

self.addEventListener('install', event => {
  console.log('[Vendora SW] Installing v1.0.0');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(e => console.warn('[SW] partial cache fail', e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[Vendora SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[Vendora SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Vendora', {
      body:    data.body || 'لديك إشعار جديد',
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open',  title: 'فتح التطبيق' },
        { action: 'close', title: 'إغلاق' }
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action !== 'close') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        const url = event.notification.data?.url || '/';
        for (const c of list) {
          if (c.url === url && 'focus' in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
    );
  }
});
