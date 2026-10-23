// Lot banc-v1 — dictionnaires de la mini-application d'essai.
let dictionnaire = {};

export async function chargerLangue(langue) {
  const reponse = await fetch(`i18n/${langue}.json`);
  dictionnaire = await reponse.json();
}

export function t(cle, valeurs = {}) {
  let texte = dictionnaire[cle] ?? cle;
  for (const [nom, valeur] of Object.entries(valeurs)) {
    texte = texte.replaceAll(`{${nom}}`, String(valeur));
  }
  return texte;
}

export function traduirePage() {
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
}
