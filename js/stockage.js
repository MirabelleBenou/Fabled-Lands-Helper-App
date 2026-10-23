// Lot v0.1 — IndexedDB, base « flh » : les personnages et les réglages. Seul ce module y touche.
const BASE = 'flh';
const VERSION_BASE = 1;
const PERSONNAGES = 'personnages';
const REGLAGES = 'reglages';

let promesseBase = null;
let persistanceDemandee = false;

function ouvrir() {
  if (promesseBase === null) {
    promesseBase = new Promise((resolu, rejete) => {
      if (typeof indexedDB === 'undefined') {
        rejete(new Error('IndexedDB indisponible'));
        return;
      }
      const demande = indexedDB.open(BASE, VERSION_BASE);
      demande.onupgradeneeded = () => {
        demande.result.createObjectStore(PERSONNAGES, { keyPath: 'id' });
        demande.result.createObjectStore(REGLAGES, { keyPath: 'cle' });
      };
      demande.onsuccess = () => {
        demande.result.onversionchange = () => demande.result.close();
        resolu(demande.result);
      };
      demande.onerror = () => rejete(demande.error);
    });
    // Une ouverture ratée se retente au prochain appel.
    promesseBase.catch(() => { promesseBase = null; });
  }
  return promesseBase;
}

// Exécute `travail(magasin)` dans une transaction ; rend ce que `travail` rend, une fois la transaction validée.
async function transaction(magasin, mode, travail) {
  const base = await ouvrir();
  return new Promise((resolu, rejete) => {
    const tx = base.transaction(magasin, mode);
    let resultat;
    const requete = travail(tx.objectStore(magasin));
    if (requete) requete.onsuccess = () => { resultat = requete.result; };
    tx.oncomplete = () => resolu(resultat);
    tx.onerror = () => rejete(tx.error);
    tx.onabort = () => rejete(tx.error ?? new Error('transaction annulée'));
  });
}

// Lot v0.2 — la base s'ouvre-t-elle ? Faux si IndexedDB est absent ou si le navigateur refuse l'ouverture.
export async function stockageDisponible() {
  try {
    await ouvrir();
    return true;
  } catch {
    return false;
  }
}

export function tousLesPersonnages() {
  return transaction(PERSONNAGES, 'readonly', (magasin) => magasin.getAll());
}

export async function lirePersonnage(id) {
  return (await transaction(PERSONNAGES, 'readonly', (magasin) => magasin.get(id))) ?? null;
}

// Enregistre (remplace ou ajoute, par id) ; au premier enregistrement, demande la protection du stockage.
export async function enregistrerPersonnages(personnages) {
  await transaction(PERSONNAGES, 'readwrite', (magasin) => {
    for (const personnage of personnages) magasin.put(personnage);
    return null;
  });
  demanderPersistance();
}

export function supprimerPersonnage(id) {
  return transaction(PERSONNAGES, 'readwrite', (magasin) => magasin.delete(id));
}

export async function lireReglage(cle) {
  const ligne = await transaction(REGLAGES, 'readonly', (magasin) => magasin.get(cle));
  return ligne ? ligne.valeur : null;
}

export function ecrireReglage(cle, valeur) {
  return transaction(REGLAGES, 'readwrite', (magasin) => magasin.put({ cle, valeur }));
}

// Sans attendre la réponse du navigateur, et une seule fois par ouverture de l'application.
function demanderPersistance() {
  if (persistanceDemandee) return;
  persistanceDemandee = true;
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {
    // le navigateur ne sait pas : sans effet
  }
}

export async function estPersistant() {
  try {
    return (await navigator.storage?.persisted?.()) === true;
  } catch {
    return false;
  }
}
