// Lot banc-v1 — module principal de la mini-application d'essai.
import { chargerLangue, t, traduirePage } from './i18n.js';
import { SCHEMA, lire } from './sauvegarde.js';
import { compter, nomDuPremier } from './personnages.js';

const CLE = 'essai.etat';
const racine = document.documentElement;
const ecran = document.getElementById('ecran');
const parametres = new URLSearchParams(location.search);
const langue = parametres.get('langue') === 'en' ? 'en' : 'fr';
const theme = parametres.get('theme') === 'chandelle' ? 'chandelle' : 'jour';

racine.lang = langue;
racine.dataset.theme = theme;

function etatCourant() {
  try {
    return lire(JSON.parse(localStorage.getItem(CLE)));
  } catch {
    return { schema: SCHEMA, personnages: [] };
  }
}

function afficher() {
  const donnees = etatCourant();
  const route = location.hash === '#/perso' ? 'perso' : 'accueil';
  if (route === 'perso') {
    ecran.innerHTML = '<h1 id="titre"></h1><div class="perso"><span id="libelle"></span> : <span id="nom"></span></div>';
    document.getElementById('titre').textContent = t('perso.titre');
    document.getElementById('libelle').textContent = t('perso.libelle');
    document.getElementById('nom').textContent = nomDuPremier(donnees);
  } else {
    ecran.innerHTML = '<h1 id="titre"></h1><p id="compteur"></p>';
    document.getElementById('titre').textContent = t('accueil.titre');
    document.getElementById('compteur').textContent = t('accueil.compteur', { n: compter(donnees) });
  }
  racine.dataset.pret = '1';
}

// Ce que fait le bouton d'import d'un fichier de sauvegarde : lire, puis enregistrer.
window.__FLH__ = {
  importer(objet) {
    const donnees = lire(objet);
    localStorage.setItem(CLE, JSON.stringify(donnees));
    return Promise.resolve();
  },
};

await chargerLangue(langue);
traduirePage();
afficher();
window.addEventListener('hashchange', () => {
  racine.removeAttribute('data-pret');
  afficher();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { type: 'module' });
}
