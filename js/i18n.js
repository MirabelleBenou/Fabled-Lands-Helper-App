// Lot v0.1 — les dictionnaires : chargement, traduction d'une clé, application des data-i18n.
// Ce module s'importe dans Node : rien n'y touche window ou document au chargement.
let dictionnaire = {};

// Pose un dictionnaire (utilisé par chargerLangue, et par les tests).
export function installerDictionnaire(nouveau) {
  dictionnaire = nouveau;
}

export async function chargerLangue(langue) {
  const reponse = await fetch(`i18n/${langue}.json`);
  installerDictionnaire(await reponse.json());
}

// La langue de l'appareil si elle commence par « fr », sinon l'anglais.
export function choisirLangue(codeAppareil) {
  return typeof codeAppareil === 'string' && codeAppareil.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

// Le texte d'une clé ; chaque {nom} est remplacé par la valeur donnée. Clé inconnue : la clé elle-même.
export function t(cle, valeurs = {}) {
  let texte = dictionnaire[cle] ?? cle;
  for (const [nom, valeur] of Object.entries(valeurs)) {
    texte = texte.replaceAll(`{${nom}}`, String(valeur));
  }
  return texte;
}

// Remplit tous les éléments à data-i18n de la page.
export function traduirePage() {
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
}
