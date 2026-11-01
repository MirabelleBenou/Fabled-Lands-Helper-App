// Lot v0.1 — le cache hors ligne : son nom suit la version, sa liste couvre les fichiers servis
// (tous sauf tests/, les .md et les LICENSE*). Chemins relatifs à la racine du site.
import { VERSION } from './version.js';

export const CACHE_NAME = 'flh-' + VERSION;

export const PRECACHE = [
  'css/app.css',
  'fonts/alegreya-latin-400-italic.woff2',
  'fonts/alegreya-latin-400-normal.woff2',
  'fonts/alegreya-latin-700-normal.woff2',
  'fonts/im-fell-english-sc-latin-400-normal.woff2',
  'i18n/en.json',
  'i18n/fr.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/icon.svg',
  'index.html',
  'js/app.js',
  'js/des.js',
  'js/feuille.js',
  'js/i18n.js',
  'js/liens.js',
  'js/livret.js',
  'js/precache.js',
  'js/pretires.js',
  'js/pwa.js',
  'js/regles.js',
  'js/sauvegarde.js',
  'js/stockage.js',
  'js/version.js',
  'js/vues.js',
  'manifest.webmanifest',
  'sw.js',
];
