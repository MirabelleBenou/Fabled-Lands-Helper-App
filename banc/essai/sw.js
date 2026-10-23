// Lot banc-v1 — service worker de la mini-application d'essai : met PRECACHE en cache sous CACHE_NAME.
import { CACHE_NAME, PRECACHE } from './js/precache.js';

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== CACHE_NAME).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  const url = new URL(requete.url);
  if (requete.method !== 'GET' || url.origin !== self.location.origin) return;
  const chemin = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  evenement.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => cache.match(new URL(chemin, self.location.origin + '/'), { ignoreSearch: true }))
      .then((trouve) => trouve || fetch(requete)),
  );
});
