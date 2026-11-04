// Service Worker: macht Wissenstag als App installierbar und offline nutzbar.
// Regel: Seite, Fragen und Nachrichten immer zuerst frisch aus dem Netz holen (neuester Stand).
// Nur ohne Netz kommt die zuletzt gespeicherte Fassung. Dateien mit Hash im Namen (assets/)
// und Flaggen ändern sich nie und kommen direkt aus dem Speicher.
const CACHE = 'wissenstag-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './data/klassen.json'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function netzZuerst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const alt = await cache.match(req, { ignoreSearch: true });
    if (alt) return alt;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) ?? Response.error();
    return Response.error();
  }
}

async function speicherZuerst(req) {
  const cache = await caches.open(CACHE);
  const alt = await cache.match(req);
  if (alt) return alt;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // tagesschau usw. direkt
  if (url.pathname.includes('/assets/') || url.pathname.includes('/flags/') || url.pathname.includes('/icons/')) {
    e.respondWith(speicherZuerst(e.request));
  } else {
    e.respondWith(netzZuerst(e.request));
  }
});
