// Lot v0.3 — les règles de calcul de la feuille d'aventure et ses bornes. Module pur : il s'importe dans Node,
// rien n'y touche window, document ou indexedDB. Chaque modification rend un personnage neuf (une copie), ou null
// quand la règle la refuse : l'écran n'enregistre alors rien.
export const COMPETENCES = ['charisme', 'combat', 'magie', 'piete', 'exploration', 'adresse'];

export const MAX_POSSESSIONS = 12;

const somme = (bonus) => bonus.reduce((total, b) => total + b.valeur, 0);

// La valeur de la compétence : sa base actuelle et ses bonus et malus.
export function totalCompetence(personnage, code) {
  const competence = personnage.competences[code];
  return competence.actuelle + somme(competence.bonus);
}

// La Défense : niveau + base actuelle de Combat + bonus de Défense (les bonus de Combat n'y entrent pas).
export function defense(personnage) {
  return personnage.niveau + personnage.competences.combat.actuelle + somme(personnage.defense.bonus);
}

// « +n », « −n » (signe moins U+2212) ou « 0 ».
export function signe(n) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${-n}`;
  return '0';
}

// Un entier lu dans un champ de saisie (chaîne), ou null si le texte n'en est pas un.
export function entierSaisi(texte) {
  const propre = String(texte ?? '').trim();
  if (propre === '') return null;
  const n = Number(propre);
  return Number.isInteger(n) ? n : null;
}

// Un nombre de la saisie libre : vide, négatif ou non entier vaut 0.
export function nombreDepart(texte) {
  const n = entierSaisi(texte);
  return n !== null && n >= 0 ? n : 0;
}

const copie = (personnage) => structuredClone(personnage);

// L'Endurance actuelle reste dans [0, max] : « + » au maximum et « − » à 0 ne font rien.
export function changerEndurance(personnage, delta) {
  const { max, actuelle } = personnage.endurance;
  const cible = actuelle + delta;
  if (cible < 0 || cible > max) return null;
  const nouveau = copie(personnage);
  nouveau.endurance.actuelle = cible;
  return nouveau;
}

// L'Endurance maximale reste ≥ 0 ; la baisser sous l'actuelle ramène l'actuelle au maximum.
export function changerEnduranceMax(personnage, delta) {
  const cible = personnage.endurance.max + delta;
  if (cible < 0) return null;
  const nouveau = copie(personnage);
  nouveau.endurance.max = cible;
  if (nouveau.endurance.actuelle > cible) nouveau.endurance.actuelle = cible;
  return nouveau;
}

// Le Niveau reste ≥ 1.
export function changerNiveau(personnage, delta) {
  const cible = personnage.niveau + delta;
  if (cible < 1) return null;
  const nouveau = copie(personnage);
  nouveau.niveau = cible;
  return nouveau;
}

// La base actuelle d'une compétence reste ≥ 0 ; l'initiale ne change jamais.
export function changerBase(personnage, code, delta) {
  const cible = personnage.competences[code].actuelle + delta;
  if (cible < 0) return null;
  const nouveau = copie(personnage);
  nouveau.competences[code].actuelle = cible;
  return nouveau;
}

// La liste des bonus d'une cible : un code de compétence, ou « defense ».
const bonusDe = (personnage, cible) => (cible === 'defense' ? personnage.defense.bonus : personnage.competences[cible].bonus);

// Un bonus ne s'ajoute que si sa valeur est un entier non nul et sa raison non vide (espaces de bord retirés).
export function ajouterBonus(personnage, cible, valeurSaisie, raisonSaisie) {
  const valeur = entierSaisi(valeurSaisie);
  const raison = String(raisonSaisie ?? '').trim();
  if (valeur === null || valeur === 0 || raison === '') return null;
  const nouveau = copie(personnage);
  bonusDe(nouveau, cible).push({ valeur, raison });
  return nouveau;
}

export function retirerBonus(personnage, cible, index) {
  if (index < 0 || index >= bonusDe(personnage, cible).length) return null;
  const nouveau = copie(personnage);
  bonusDe(nouveau, cible).splice(index, 1);
  return nouveau;
}

// La Bourse par « − » et « + » : elle reste ≥ 0.
export function changerBourse(personnage, delta) {
  const cible = personnage.bourse + delta;
  if (cible < 0) return null;
  const nouveau = copie(personnage);
  nouveau.bourse = cible;
  return nouveau;
}

// « Gagner » et « Dépenser » : un montant entier ≥ 1, sinon rien ({ issue: 'invalide' }) ; dépenser plus que la
// Bourse est refusé ({ issue: 'insuffisante' }) ; sinon { issue: 'ok', personnage }.
export function operationBourse(personnage, sens, montantSaisi) {
  const montant = entierSaisi(montantSaisi);
  if (montant === null || montant < 1) return { issue: 'invalide' };
  if (sens === 'depenser' && montant > personnage.bourse) return { issue: 'insuffisante' };
  const nouveau = copie(personnage);
  nouveau.bourse += sens === 'depenser' ? -montant : montant;
  return { issue: 'ok', personnage: nouveau };
}

// Une possession ne s'ajoute que si son texte est non vide et qu'il y en a moins de 12 ; doublons permis.
export function ajouterPossession(personnage, texte) {
  const propre = String(texte ?? '').trim();
  if (propre === '' || personnage.possessions.length >= MAX_POSSESSIONS) return null;
  const nouveau = copie(personnage);
  nouveau.possessions.push(propre);
  return nouveau;
}

// Retire l'entrée `index` d'une liste du personnage (possessions, titres, bénédictions, malédictions, résurrections).
export function retirerDeListe(personnage, liste, index) {
  if (index < 0 || index >= personnage[liste].length) return null;
  const nouveau = copie(personnage);
  nouveau[liste].splice(index, 1);
  return nouveau;
}

// Un titre ne s'ajoute que si son texte est non vide.
export function ajouterTitre(personnage, texte) {
  const propre = String(texte ?? '').trim();
  if (propre === '') return null;
  const nouveau = copie(personnage);
  nouveau.titres.push(propre);
  return nouveau;
}

// Une entrée des cultes ne s'ajoute que si au moins un champ est rempli ; un livre ou une section vide ou non
// entier vaut null. `liste` : « benedictions », « maledictions » ou « resurrections ».
export function ajouterEntree(personnage, liste, saisie) {
  const textes = Object.values(saisie).map((v) => String(v ?? '').trim());
  if (textes.every((v) => v === '')) return null;
  const texte = (nom) => String(saisie[nom] ?? '').trim();
  const entree = liste === 'resurrections'
    ? { origine: texte('origine'), lieu: texte('lieu'), livre: entierSaisi(saisie.livre), section: entierSaisi(saisie.section) }
    : { origine: texte('origine'), consequences: texte('consequences') };
  const nouveau = copie(personnage);
  nouveau[liste].push(entree);
  return nouveau;
}

// La saisie libre : les valeurs de départ posées sur un personnage neuf. Le Niveau vaut au moins 1 ; l'Endurance
// actuelle égale la maximale ; l'initiale et l'actuelle de chaque compétence égalent la valeur saisie ; aucun bonus.
export function feuilleLibre(personnage, saisie) {
  const nouveau = copie(personnage);
  nouveau.niveau = Math.max(1, nombreDepart(saisie.niveau));
  const endurance = nombreDepart(saisie.endurance);
  nouveau.endurance = { max: endurance, actuelle: endurance };
  nouveau.bourse = nombreDepart(saisie.bourse);
  for (const code of COMPETENCES) {
    const valeur = nombreDepart(saisie.competences?.[code]);
    nouveau.competences[code] = { initiale: valeur, actuelle: valeur, bonus: [] };
  }
  return nouveau;
}
