// Lot v0.1 — le démarrage : réglages, langue, ambiance, routes, data-pret, window.__FLH__, service worker.
// Lot v0.2 — l'écoute de l'installation, le bandeau de mise à jour, l'enregistrement du service worker à jour.
// Lot v0.3 — les routes de la création et de la fiche (js/feuille.js) ; le haut de page seulement quand la page change.
// Lot v0.3.1 — la page du mode pré-tiré comprend le choix : toucher un personnage ramène l'écran en haut.
// Lot v0.4 — la route de l'éditeur du bonus d'un objet, #/perso/<id>/possessions/<index>.
// Lot v0.6 — les rubriques Aventure et Combats, et ce qu'elles ouvrent : #/perso/<id>/aventure|combats/<ouvert>.
import { chargerLangue, choisirLangue, traduirePage } from './i18n.js';
import { lire } from './sauvegarde.js';
import { ecouterInstallation, surveillerControleur } from './pwa.js';
import { ecrireReglage, enregistrerPersonnages, lireReglage } from './stockage.js';
import { vueAccueil, vueApropos, vueReglages } from './vues.js';
import { vueFiche, vueNouveau } from './feuille.js';

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

// Les routes sont des ancres. Toute route inconnue mène à l'accueil. `page` nomme la page affichée : le haut de
// page n'est remis que quand elle change (lot v0.3).
const RUBRIQUES = ['statistiques', 'possessions', 'cultes', 'aventure', 'combats'];

function analyserRoute(hash) {
  const morceaux = hash.replace(/^#\/?/, '').split('/');
  const accueil = { vue: vueAccueil, onglet: 'accueil', page: 'accueil' };
  if (morceaux[0] === 'nouveau') {
    // Lot v0.3 — #/nouveau, #/nouveau/pretire[/<id>] : le mode pré-tiré ; #/nouveau/libre : la saisie libre.
    if (morceaux.length === 1 || (morceaux[1] === 'pretire' && morceaux.length <= 3)) {
      let choix = null;
      try {
        choix = morceaux.length === 3 ? decodeURIComponent(morceaux[2]) : null;
      } catch {
        choix = null;
      }
      return { vue: vueNouveau, onglet: 'accueil', page: `nouveau/pretire/${choix ?? ''}`, mode: 'pretire', choix };
    }
    if (morceaux[1] === 'libre' && morceaux.length === 2) {
      return { vue: vueNouveau, onglet: 'accueil', page: 'nouveau/libre', mode: 'libre', choix: null };
    }
    return accueil;
  }
  if (morceaux[0] === 'reglages' && morceaux.length === 1) return { vue: vueReglages, onglet: 'reglages', page: 'reglages' };
  if (morceaux[0] === 'apropos' && morceaux.length === 1) return { vue: vueApropos, onglet: 'apropos', page: 'apropos' };
  // Lot v0.3 — #/perso/<id>[/<rubrique>[/<déplié>]] ; une rubrique inconnue montre Statistiques.
  if (morceaux[0] === 'perso' && morceaux.length >= 2 && morceaux.length <= 4 && morceaux[1] !== '') {
    let id;
    try {
      id = decodeURIComponent(morceaux[1]);
    } catch {
      return accueil;
    }
    const rubrique = RUBRIQUES.includes(morceaux[2]) ? morceaux[2] : 'statistiques';
    const deplie = morceaux[2] === 'statistiques' && morceaux.length === 4 ? morceaux[3] : null;
    // Lot v0.4 — #/perso/<id>/possessions/<index> : l'objet ouvert (un entier ; la fiche vérifie qu'il est dans la
    // liste) ; la page reste celle des Possessions, l'ouverture ne ramène pas en haut.
    const objet = morceaux[2] === 'possessions' && morceaux.length === 4 && /^(0|[1-9][0-9]*)$/.test(morceaux[3]) ? Number(morceaux[3]) : null;
    // Lot v0.6 — #/perso/<id>/aventure/<ouvert>, #/perso/<id>/combats/<ouvert> : le quatrième morceau tel quel (la
    // fiche le lit) ; la page reste celle de la rubrique.
    const ouvert = (morceaux[2] === 'aventure' || morceaux[2] === 'combats') && morceaux.length === 4 ? morceaux[3] : null;
    return { vue: vueFiche, onglet: 'accueil', page: `perso/${id}/${rubrique}`, id, rubrique, deplie, objet, ouvert };
  }
  return accueil;
}

const contexte = {
  langue: () => etat.langue,
  ambiance: () => etat.ambiance,
  naviguer: (ancre) => { location.hash = ancre; },
  // Lot v0.3 — l'écran se rend à nouveau (après un changement enregistré sur la fiche).
  rafraichir: () => afficher(),
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
    noeuds = await route.vue(contexte, route);
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

// Lot v0.2 — l'écoute de l'installation commence avant le premier écran. Quand l'état change, seuls l'accueil et les
// réglages se rendent à nouveau (un formulaire en cours ne se vide pas) ; avant le premier rendu, rien à refaire :
// le premier écran lit l'état au moment de se rendre.
let demarre = false;
ecouterInstallation(() => {
  if (!demarre) return;
  const { vue } = analyserRoute(location.hash);
  if (vue === vueAccueil || vue === vueReglages) afficher();
});

// Démarrage : les réglages enregistrés, puis la langue, puis le premier écran.
const langueEnregistree = await lireReglage('langue').catch(() => null);
const ambianceEnregistree = await lireReglage('ambiance').catch(() => null);
etat.ambiance = AMBIANCES.includes(ambianceEnregistree) ? ambianceEnregistree : 'auto';
etat.langue = etat.forceLangue ?? (LANGUES.includes(langueEnregistree) ? langueEnregistree : choisirLangue(navigator.language));
appliquerTheme();
racine.lang = etat.langue;
await chargerLangue(etat.langue);
traduirePage();

let pageAffichee = analyserRoute(location.hash).page;
window.addEventListener('hashchange', () => {
  const page = analyserRoute(location.hash).page;
  if (page !== pageAffichee) window.scrollTo(0, 0);
  pageAffichee = page;
  afficher();
});
demarre = true;
await afficher();

// Lot v0.2 — le bandeau « nouvelle version prête » : seulement si la page avait déjà un contrôleur (pas au premier chargement).
const bandeau = document.querySelector('[data-test=bandeau-maj]');
document.querySelector('[data-test=recharger]').addEventListener('click', () => location.reload());
surveillerControleur(() => { bandeau.hidden = false; });

if ('serviceWorker' in navigator) {
  // updateViaCache « none » : les modules que sw.js importe ne passent pas par le cache HTTP.
  navigator.serviceWorker.register('sw.js', { type: 'module', updateViaCache: 'none' }).catch((e) => console.warn('hors ligne indisponible', e));
}
