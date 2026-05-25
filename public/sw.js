const CACHE_NAME = 'absen-attendance-v7';

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/globe.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

const isStaticAsset = (url) => {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/)
  );
};

const isApiCall = (url) => new URL(url).pathname.startsWith('/api/');

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.url.includes('hot-update')) return;

  const url = request.url;

  if (isApiCall(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((networkRes) => {
            if (networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkRes;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkRes) => {
        if (networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkRes;
      })
      .catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/offline.html').then(
            (offlinePage) => offlinePage || hardcodedOfflinePage()
          );
        }

        return caches.match(request).then((cached) => {
          if (cached) return cached;
        });
      })
  );
});

function hardcodedOfflinePage() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Tidak Ada Koneksi</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8f9ff;
      color: #0b1c30;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      text-align: center;
      padding: 24px;
      gap: 0;
    }
    .icon {
      width: 80px; height: 80px;
      background: rgba(186,26,26,.1);
      border-radius: 28px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 8px 30px rgba(186,26,26,.12);
      color: #ba1a1a;
    }
    h2 { font-size: 22px; font-weight: 600; margin: 0 0 8px; }
    p  { font-size: 14px; color: #5c5f61; max-width: 280px; line-height: 1.5; margin: 0 0 24px; }
    button {
      padding: 12px 28px;
      border: none; border-radius: 100px;
      background: #0b1c30; color: #fff;
      font-size: 15px; font-weight: 500;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <line x1="2" y1="2" x2="22" y2="22"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  </div>
  <h2>Tidak Ada Koneksi Internet</h2>
  <p>Silakan periksa koneksi jaringan Anda dan coba lagi.</p>
  <button onclick="location.reload()">Coba Lagi</button>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}