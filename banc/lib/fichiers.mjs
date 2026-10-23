// Lot banc-v1 — lecture d'un dossier : liste des fichiers, tailles, sha256, empreinte.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Ordre d'octets (comme LC_ALL=C sort), sur le texte UTF-8 des chemins.
export function comparerOctets(a, b) {
  return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

// Tous les fichiers réguliers du dossier (récursif), chemins relatifs en « / »,
// triés par ordre d'octets. Les liens symboliques et les dossiers vides ne comptent pas.
export function lister(dossier) {
  const chemins = [];
  const parcourir = (relatif) => {
    const absolu = relatif === '' ? dossier : join(dossier, relatif);
    for (const entree of readdirSync(absolu, { withFileTypes: true })) {
      const chemin = relatif === '' ? entree.name : `${relatif}/${entree.name}`;
      if (entree.isDirectory()) parcourir(chemin);
      else if (entree.isFile()) chemins.push(chemin);
    }
  };
  parcourir('');
  return chemins.sort(comparerOctets);
}

export function taille(dossier, chemin) {
  return statSync(join(dossier, chemin)).size;
}

export function sha256Fichier(dossier, chemin) {
  return createHash('sha256').update(readFileSync(join(dossier, chemin))).digest('hex');
}

export function lireTexte(dossier, chemin) {
  return readFileSync(join(dossier, chemin), 'utf8');
}

// Les lignes « sha256  chemin » (la sortie de sha256sum sur les fichiers triés).
export function lignesSha(dossier, chemins) {
  return chemins.map((c) => `${sha256Fichier(dossier, c)}  ${c}`);
}

// Le sha256 du texte formé par ces lignes, chacune suivie d'un saut de ligne.
export function empreinte(lignes) {
  const texte = lignes.map((l) => `${l}\n`).join('');
  return createHash('sha256').update(texte, 'utf8').digest('hex');
}

export function empreinteDossier(dossier) {
  return empreinte(lignesSha(dossier, lister(dossier)));
}
