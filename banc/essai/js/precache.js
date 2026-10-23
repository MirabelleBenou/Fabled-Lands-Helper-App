// Lot banc-v1 — le cache hors ligne de la mini-application d'essai.
import { VERSION } from './version.js';

export const CACHE_NAME = 'flh-' + VERSION;

export const PRECACHE = [
  'css/style.css',
  'i18n/en.json',
  'i18n/fr.json',
  'index.html',
  'js/app.js',
  'js/i18n.js',
  'js/personnages.js',
  'js/precache.js',
  'js/sauvegarde.js',
  'js/version.js',
  'manifest.webmanifest',
  'sw.js',
];
