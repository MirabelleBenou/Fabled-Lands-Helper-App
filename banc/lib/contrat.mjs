// Lot banc-v1 — exécuté par le rituel dans un processus fils, avec pour dossier courant la COPIE
// temporaire de l'application : importe les modules du contrat (version, précache, sauvegarde) et
// relit les sauvegardes de référence. Écrit une ligne « @@CONTRAT@@ {json} » sur la sortie.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { dossier, sauvegardes } = JSON.parse(process.argv[2]);

async function importer(chemin) {
  const complet = join(dossier, chemin);
  if (!existsSync(complet)) return null;
  try {
    return await import(pathToFileURL(complet).href);
  } catch {
    return null;
  }
}

const resultat = { version: null, cacheName: null, precache: null, schema: null, lues: 0 };

const mVersion = await importer('js/version.js');
if (mVersion && typeof mVersion.VERSION === 'string') resultat.version = mVersion.VERSION;

const mPrecache = await importer('js/precache.js');
if (mPrecache) {
  if (typeof mPrecache.CACHE_NAME === 'string') resultat.cacheName = mPrecache.CACHE_NAME;
  if (Array.isArray(mPrecache.PRECACHE)) resultat.precache = mPrecache.PRECACHE.filter((e) => typeof e === 'string');
}

const mSauvegarde = await importer('js/sauvegarde.js');
if (mSauvegarde && Number.isInteger(mSauvegarde.SCHEMA)) resultat.schema = mSauvegarde.SCHEMA;
if (mSauvegarde && typeof mSauvegarde.lire === 'function') {
  for (const fichier of sauvegardes) {
    try {
      await mSauvegarde.lire(JSON.parse(readFileSync(fichier, 'utf8')));
      resultat.lues += 1;
    } catch {
      // illisible : ne compte pas
    }
  }
}

process.stdout.write(`\n@@CONTRAT@@ ${JSON.stringify(resultat)}\n`);
