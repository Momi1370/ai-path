// Offline copy of the app and its content. The content list comes from content/precache.json (written by
// tools/build-content.mjs); its version changes whenever the content does, which refreshes the cache.
const SHELL = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'vendor/ts-fsrs.mjs',
  'js/app.js', 'js/dom.js', 'js/store.js', 'js/srs.js', 'js/review.js', 'js/search.js', 'js/plan.js', 'js/videos.js',
  'js/ui/today.js', 'js/ui/watch.js', 'js/ui/review.js', 'js/ui/notes.js', 'js/ui/progress.js'];
const PREFIX = 'aipath-';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const meta = await (await fetch('content/precache.json', { cache: 'reload' })).json();
    const cache = await caches.open(PREFIX + meta.version);
    await cache.addAll([...SHELL, 'content/precache.json', ...meta.files].map((u) => new Request(u, { cache: 'reload' })));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const meta = await (await fetch('content/precache.json', { cache: 'no-cache' }).catch(() => caches.match('content/precache.json')))?.json?.().catch(() => null);
    const keep = meta ? PREFIX + meta.version : null;
    for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== keep) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Network first, so new content shows up as soon as you are online; the cache answers when you are not.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req.url, { cache: 'no-cache' }).catch(async () => (await caches.match(req.url, { ignoreSearch: true })) ?? (await caches.match('index.html')) ?? Response.error()),
  );
});
