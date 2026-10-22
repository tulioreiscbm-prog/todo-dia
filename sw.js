/* Todo dIA — service worker: deixa o app abrir sem internet. Os dados vão direto para a planilha (não passam por aqui). */
const VERSAO = 'todo-dia-2.0.0';
const BASE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // páginas do próprio app: tenta a internet (pega atualizações) e cai no que está guardado
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(VERSAO).then((x) => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const c = r.clone(); caches.open(VERSAO).then((x) => x.put(req, c)); return r; })));
    return;
  }
  // fontes do Google: usa a guardada e atualiza por trás
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSAO + '-fontes').then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
  // planilha (script.google.com) e demais: não interfere
});
