// Lot v0.2 — l'installation et les mises à jour : l'état d'installation, l'événement gardé, le bouton « Installer »,
// la surveillance du contrôleur du service worker, la vérification des mises à jour.
// Ce module s'importe dans Node : rien n'y touche window, document ou navigator au chargement.

// L'état d'installation : « installee » l'emporte, puis « proposable » (le navigateur sait installer d'un geste),
// sinon « manuelle » (l'aide dit le geste à faire dans le menu).
export function etatInstallation({ autonome, evenementDisponible }) {
  if (autonome) return 'installee';
  if (evenementDisponible) return 'proposable';
  return 'manuelle';
}

// L'issue d'une vérification : « impossible » (pas de service worker inscrit, hors ligne, ou mise à jour rejetée),
// sinon « telechargement » si une version neuve arrive, sinon « a_jour ».
export function issueVerification({ priseEnCharge, enLigne, erreur, nouvelle }) {
  if (!priseEnCharge || !enLigne || erreur) return 'impossible';
  return nouvelle ? 'telechargement' : 'a_jour';
}

const MODES_AUTONOMES = ['standalone', 'fullscreen', 'minimal-ui'];

let evenementGarde = null;
let installeeSignalee = false;
let surChangementEtat = () => {};

// L'application tourne-t-elle installée (hors de l'onglet du navigateur) ?
function estAutonome() {
  try {
    return MODES_AUTONOMES.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)
      || navigator.standalone === true;
  } catch {
    return false;
  }
}

// L'état d'installation d'ici et maintenant.
export function etatCourant() {
  return etatInstallation({
    autonome: installeeSignalee || estAutonome(),
    evenementDisponible: evenementGarde !== null,
  });
}

// L'écoute, posée au démarrage : `rappel` est appelé à chaque changement d'état.
export function ecouterInstallation(rappel) {
  surChangementEtat = rappel;
  window.addEventListener('beforeinstallprompt', (evenement) => {
    evenement.preventDefault();
    evenementGarde = evenement;
    surChangementEtat();
  });
  window.addEventListener('appinstalled', () => {
    evenementGarde = null;
    installeeSignalee = true;
    surChangementEtat();
  });
}

// Le bouton « Installer » : propose l'installation, puis oublie l'événement (il ne sert qu'une fois).
export async function installer() {
  const evenement = evenementGarde;
  if (evenement === null) return;
  evenementGarde = null;
  try {
    await evenement.prompt();
  } catch {
    // la proposition a échoué : l'état repasse à « manuelle »
  }
  surChangementEtat();
}

// Appelle `surNouvelleVersion` quand une version neuve prend la main sur une page déjà contrôlée :
// la prise de contrôle du tout premier service worker ne compte pas.
export function surveillerControleur(surNouvelleVersion) {
  if (!('serviceWorker' in navigator)) return;
  let avaitControleur = navigator.serviceWorker.controller !== null;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (avaitControleur) surNouvelleVersion();
    avaitControleur = true;
  });
}

// « Vérifier les mises à jour » : rend l'issue (« impossible », « telechargement » ou « a_jour »).
// On n'appelle update() ni sans service worker inscrit, ni hors ligne.
export async function verifierMisesAJour() {
  let inscription = null;
  try {
    if ('serviceWorker' in navigator) inscription = (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    inscription = null;
  }
  const priseEnCharge = inscription !== null;
  const enLigne = navigator.onLine;
  let erreur = false;
  let nouvelle = false;
  if (priseEnCharge && enLigne) {
    try {
      await inscription.update();
      nouvelle = Boolean(inscription.installing || inscription.waiting);
    } catch {
      erreur = true;
    }
  }
  return issueVerification({ priseEnCharge, enLigne, erreur, nouvelle });
}
