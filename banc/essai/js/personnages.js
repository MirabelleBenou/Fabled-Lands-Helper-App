// Lot banc-v1 — logique pure de la mini-application d'essai (sans écran, donc testable).
export function compter(donnees) {
  return donnees.personnages.length;
}

export function nomDuPremier(donnees) {
  return donnees.personnages.length > 0 ? donnees.personnages[0].nom : '';
}
