// Offline copy of the app and its content. The content list comes from content/precache.json (written by
// tools/build-content.mjs); its version changes whenever the content does, which refreshes the cache.
const SHELL = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'vendor/ts-fsrs.mjs',
  'js/app.js', 'js/dom.js', 'js/store.js', 'js/srs.js', 'js/review.js', 'js/search.js', 'js/plan.js', 'js/videos.js',
  'js/ui/today.js', 'js/ui/watch.js', 'js/ui/review.js', 'js/ui/notes.js', 'js/ui/listen.js', 'js/timing.js', 'js/ui/progress.js', 'js/i18n.js'];
const PREFIX = 'aipath-';
const AUDIO = 'audio-aipath'; // chapter audio is kept when the app updates; the app removes files the manifest no longer lists

// Chapter audio never changes under the same address (the text hash is in the name), so it is kept once played.
// An iPhone asks for media in byte ranges and only plays the answer if it is a 206, so a range is cut out of the whole file here.
async function audioResponse(req) {
  const cache = await caches.open(AUDIO);
  let res = await cache.match(req.url);
  if (!res) {
    res = await fetch(req.url);
    if (!res.ok) return res;
    try { await cache.put(req.url, res.clone()); } catch { /* storage full: still play it */ }
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (!range || !res.ok) return res;
  const data = await res.arrayBuffer();
  const start = range[1] ? Number(range[1]) : 0;
  const end = range[2] ? Math.min(Number(range[2]), data.byteLength - 1) : data.byteLength - 1;
  return new Response(data.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: { 'Content-Type': 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${data.byteLength}`, 'Content-Length': String(end - start + 1) } });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const meta = await (await fetch('content/precache.json', { cache: 'reload' })).json();
    const cache = await caches.open(PREFIX + meta.version);
    await cache.addAll([...SHELL, 'content/precache.json', ...meta.files].map((u) => new Request(u, { cache: 'reload' })));
    await cache.add(new Request('audio/manifest.json', { cache: 'reload' })).catch(() => {}); // only if the chapters have audio
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
  if (/\/audio\/[a-z]+\/ch-\d+\.[0-9a-f]+\.(mp3|json)$/.test(new URL(req.url).pathname)) {
    event.respondWith(audioResponse(req).catch(() => Response.error()));
    return;
  }
  event.respondWith(
    fetch(req.url, { cache: 'no-cache' }).catch(async () => (await caches.match(req.url, { ignoreSearch: true })) ?? (await caches.match('index.html')) ?? Response.error()),
  );
});
