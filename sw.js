// Lot v0.1 — le service worker : met PRECACHE en cache sous CACHE_NAME, répond d'abord depuis le cache.
// Module ES : il importe js/precache.js. Les chemins sont relatifs à ce fichier, donc au sous-chemin du site.
import { CACHE_NAME, PRECACHE } from './js/precache.js';

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE_NAME)
      // « reload » : on ne remplit pas le cache avec une copie périmée du cache HTTP du navigateur.
      .then((cache) => cache.addAll(PRECACHE.map((chemin) => new Request(chemin, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom.startsWith('flh-') && nom !== CACHE_NAME).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;
  const adresse = new URL(requete.url);
  if (adresse.origin !== self.location.origin) return;
  const racine = new URL('./', self.location.href);
  // Une navigation vers la racine du site (avec ou sans « ? ») reçoit index.html.
  const cible = adresse.pathname === racine.pathname ? new URL('index.html', racine) : adresse;
  evenement.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => cache.match(cible, { ignoreSearch: true }))
      .then((trouve) => trouve || fetch(requete)),
  );
});
