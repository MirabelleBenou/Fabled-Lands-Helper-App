// Lot v0.1 — le démarrage : réglages, langue, ambiance, routes, data-pret, window.__FLH__, service worker.
import { chargerLangue, choisirLangue, traduirePage } from './i18n.js';
import { lire } from './sauvegarde.js';
import { ecrireReglage, enregistrerPersonnages, lireReglage } from './stockage.js';
import { vueAccueil, vueApropos, vueFiche, vueNouveau, vueReglages } from './vues.js';

const racine = document.documentElement;
const ecran = document.getElementById('ecran');
const parametres = new URLSearchParams(location.search);
const sombre = window.matchMedia('(prefers-color-scheme: dark)');

const LANGUES = ['fr', 'en'];
const AMBIANCES = ['auto', 'jour', 'chandelle'];

// Langue et thème forcés par l'adresse : ils l'emportent sur les réglages, sans être enregistrés.
const etat = {
  langue: 'fr',
  ambiance: 'auto',
  forceLangue: LANGUES.includes(parametres.get('langue')) ? parametres.get('langue') : null,
  forceTheme: ['jour', 'chandelle'].includes(parametres.get('theme')) ? parametres.get('theme') : null,
};

function appliquerTheme() {
  const resolu = etat.forceTheme ?? (etat.ambiance === 'auto' ? (sombre.matches ? 'chandelle' : 'jour') : etat.ambiance);
  racine.dataset.theme = resolu;
}
sombre.addEventListener('change', appliquerTheme);
appliquerTheme();

// Lit un fichier de sauvegarde (déjà décodé), l'enregistre ; rend le nombre de personnages importés.
// C'est ce que fait le bouton d'import, et ce que la fonction du banc appelle.
async function importer(objet) {
  const donnees = lire(objet);
  await enregistrerPersonnages(donnees.personnages);
  return donnees.personnages.length;
}
window.__FLH__ = { importer };

// Les routes sont des ancres. Toute route inconnue mène à l'accueil.
function analyserRoute(hash) {
  const morceaux = hash.replace(/^#\/?/, '').split('/');
  if (morceaux[0] === 'nouveau' && morceaux.length === 1) return { vue: vueNouveau, onglet: 'accueil' };
  if (morceaux[0] === 'reglages' && morceaux.length === 1) return { vue: vueReglages, onglet: 'reglages' };
  if (morceaux[0] === 'apropos' && morceaux.length === 1) return { vue: vueApropos, onglet: 'apropos' };
  if (morceaux[0] === 'perso' && morceaux.length === 2 && morceaux[1] !== '') {
    try {
      return { vue: vueFiche, onglet: 'accueil', id: decodeURIComponent(morceaux[1]) };
    } catch {
      return { vue: vueAccueil, onglet: 'accueil' };
    }
  }
  return { vue: vueAccueil, onglet: 'accueil' };
}

const contexte = {
  langue: () => etat.langue,
  ambiance: () => etat.ambiance,
  naviguer: (ancre) => { location.hash = ancre; },
  importer,
  async changerLangue(code) {
    await chargerLangue(code);
    etat.langue = code;
    etat.forceLangue = null;
    racine.lang = code;
    await ecrireReglage('langue', code).catch(() => {});
    traduirePage();
    await afficher();
  },
  async changerAmbiance(valeur) {
    etat.ambiance = valeur;
    etat.forceTheme = null;
    appliquerTheme();
    await ecrireReglage('ambiance', valeur).catch(() => {});
  },
};

let jeton = 0;

async function afficher() {
  const moi = ++jeton;
  racine.removeAttribute('data-pret');
  const route = analyserRoute(location.hash);
  let noeuds = [];
  try {
    noeuds = await route.vue(contexte, route.id);
  } catch (e) {
    console.warn('écran non rendu', e);
  }
  if (moi !== jeton) return;
  ecran.replaceChildren(...noeuds);
  for (const onglet of document.querySelectorAll('[data-test=onglet]')) {
    if (onglet.dataset.onglet === route.onglet) onglet.setAttribute('aria-current', 'page');
    else onglet.removeAttribute('aria-current');
  }
  racine.dataset.pret = '1';
}

// Démarrage : les réglages enregistrés, puis la langue, puis le premier écran.
const langueEnregistree = await lireReglage('langue').catch(() => null);
const ambianceEnregistree = await lireReglage('ambiance').catch(() => null);
etat.ambiance = AMBIANCES.includes(ambianceEnregistree) ? ambianceEnregistree : 'auto';
etat.langue = etat.forceLangue ?? (LANGUES.includes(langueEnregistree) ? langueEnregistree : choisirLangue(navigator.language));
appliquerTheme();
racine.lang = etat.langue;
await chargerLangue(etat.langue);
traduirePage();

window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  afficher();
});
await afficher();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { type: 'module' }).catch((e) => console.warn('hors ligne indisponible', e));
}
