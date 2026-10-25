// Lot v0.3 — les règles de calcul de la feuille d'aventure et ses bornes. Module pur : il s'importe dans Node,
// rien n'y touche window, document ou indexedDB. Chaque modification rend un personnage neuf (une copie), ou null
// quand la règle la refuse : l'écran n'enregistre alors rien.
// Lot v0.4 — le bonus des objets : une possession est un objet { texte, bonus }, son bonus entre seul dans le total.
// Lot v0.6 — le journal : la section en cours et le chemin parcouru, les quêtes, les notes, les combats. Rien n'y
// est calculé : ni jet, ni dégât, ni issue de combat.
export const COMPETENCES = ['charisme', 'combat', 'magie', 'piete', 'exploration', 'adresse'];

// Lot v0.4 — les cibles d'un bonus d'objet : les six compétences, dans l'ordre de COMPETENCES, puis la Défense.
export const CIBLES = [...COMPETENCES, 'defense'];

export const MAX_POSSESSIONS = 12;

// Lot v0.6 — le chemin parcouru ne garde que ses 200 dernières sections.
export const MAX_HISTORIQUE = 200;

const somme = (bonus) => bonus.reduce((total, b) => total + b.valeur, 0);

// Lot v0.4 — les objets transportés dont le bonus vise `cible`, dans l'ordre des possessions :
// { valeur, raison (le texte de l'objet), index (sa place dans possessions), compte }. Un malus compte toujours ;
// parmi les bonus, seul le plus grand compte (à égalité, le premier). Cette règle ne vit qu'ici.
export function bonusObjets(personnage, cible) {
  const liste = [];
  personnage.possessions.forEach((objet, index) => {
    if (objet.bonus && objet.bonus.cible === cible) liste.push({ valeur: objet.bonus.valeur, raison: objet.texte, index, compte: false });
  });
  let meilleur = null;
  for (const b of liste) {
    if (b.valeur < 0) b.compte = true;
    else if (meilleur === null || b.valeur > meilleur.valeur) meilleur = b;
  }
  if (meilleur !== null) meilleur.compte = true;
  return liste;
}

// Lot v0.4 — la somme des bonus d'objets qui comptent pour `cible`.
const sommeObjets = (personnage, cible) => somme(bonusObjets(personnage, cible).filter((b) => b.compte));

// La valeur de la compétence : sa base actuelle, ses bonus et malus à la main, et ceux des objets qui comptent.
export function totalCompetence(personnage, code) {
  const competence = personnage.competences[code];
  return competence.actuelle + somme(competence.bonus) + sommeObjets(personnage, code);
}

// La Défense : niveau + base actuelle de Combat + bonus de Défense, à la main et d'objets (les bonus de Combat,
// à la main comme d'objet, n'y entrent pas).
export function defense(personnage) {
  return personnage.niveau + personnage.competences.combat.actuelle + somme(personnage.defense.bonus)
    + sommeObjets(personnage, 'defense');
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

// Lot v0.4 — le bonus d'un objet saisi : cible vide → { bonus: null } ; une cible de CIBLES et une valeur entière
// non nulle → { bonus: { cible, valeur } } ; sinon null (saisie refusée).
function bonusSaisi(cible, valeurSaisie) {
  if (cible === '') return { bonus: null };
  if (!CIBLES.includes(cible)) return null;
  const valeur = entierSaisi(valeurSaisie);
  if (valeur === null || valeur === 0) return null;
  return { bonus: { cible, valeur } };
}

// Une possession ne s'ajoute que si son texte est non vide et qu'il y en a moins de 12 ; doublons permis.
// Lot v0.4 — elle devient l'objet { texte, bonus } ; un bonus saisi invalide refuse l'ajout.
export function ajouterPossession(personnage, texte, cible = '', valeur = '') {
  const propre = String(texte ?? '').trim();
  if (propre === '' || personnage.possessions.length >= MAX_POSSESSIONS) return null;
  const saisi = bonusSaisi(cible, valeur);
  if (saisi === null) return null;
  const nouveau = copie(personnage);
  nouveau.possessions.push({ texte: propre, bonus: saisi.bonus });
  return nouveau;
}

// Lot v0.4 — le bonus de l'objet `index` change (cible vide : plus de bonus) ; son texte ne change pas.
// Index hors de la liste ou saisie invalide → null.
export function changerBonusObjet(personnage, index, cible, valeur) {
  if (!Number.isInteger(index) || index < 0 || index >= personnage.possessions.length) return null;
  const saisi = bonusSaisi(cible, valeur);
  if (saisi === null) return null;
  const nouveau = copie(personnage);
  nouveau.possessions[index].bonus = saisi.bonus;
  return nouveau;
}

// Retire l'entrée `index` d'une liste du personnage (possessions, titres, bénédictions, malédictions, résurrections ;
// lot v0.6 : quêtes, notes, combats).
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

// ---- Lot v0.6 — le journal ------------------------------------------------------------------------------

// Une section valide : un livre et une section entiers ≥ 1, lus dans la saisie ; sinon null.
function sectionSaisie(livreSaisi, sectionSaisie) {
  const livre = entierSaisi(livreSaisi);
  const section = entierSaisi(sectionSaisie);
  if (livre === null || section === null || livre < 1 || section < 1) return null;
  return { livre, section };
}

const dansListe = (liste, index) => Number.isInteger(index) && index >= 0 && index < liste.length;

// « Aller » : la section quittée (si elle n'est pas null) s'ajoute à la fin du chemin, qui ne garde que ses
// MAX_HISTORIQUE dernières entrées ; puis la section en cours change. La même section, ou une saisie invalide → null.
export function allerSection(personnage, livreSaisi, sectionSaisi) {
  const cible = sectionSaisie(livreSaisi, sectionSaisi);
  if (cible === null) return null;
  const { livre, section } = personnage.section_en_cours;
  if (cible.livre === livre && cible.section === section) return null;
  const nouveau = copie(personnage);
  if (section !== null) {
    nouveau.historique.push({ livre, section });
    nouveau.historique = nouveau.historique.slice(-MAX_HISTORIQUE);
  }
  nouveau.section_en_cours = cible;
  return nouveau;
}

// Une quête ne s'ajoute que si son titre (espaces de bord retirés) est non vide.
export function ajouterQuete(personnage, titreSaisi) {
  const titre = String(titreSaisi ?? '').trim();
  if (titre === '') return null;
  const nouveau = copie(personnage);
  nouveau.quetes.push({ titre, personnages: '', sections: [], terminee: false });
  return nouveau;
}

// `champs` : un ou plusieurs de titre, personnages (espaces de bord retirés) et terminee. Un titre vide, ou un index
// hors de la liste → null.
export function modifierQuete(personnage, index, champs) {
  if (!dansListe(personnage.quetes, index)) return null;
  const nouveau = copie(personnage);
  const quete = nouveau.quetes[index];
  if ('titre' in champs) {
    const titre = String(champs.titre ?? '').trim();
    if (titre === '') return null;
    quete.titre = titre;
  }
  if ('personnages' in champs) quete.personnages = String(champs.personnages ?? '').trim();
  if ('terminee' in champs) quete.terminee = champs.terminee === true;
  return nouveau;
}

// Une section importante s'ajoute à la fin de celles de la quête ; saisie invalide, index hors de la liste ou
// section déjà présente → null.
export function ajouterSectionQuete(personnage, index, livreSaisi, sectionSaisi) {
  const cible = sectionSaisie(livreSaisi, sectionSaisi);
  if (cible === null || !dansListe(personnage.quetes, index)) return null;
  if (personnage.quetes[index].sections.some((s) => s.livre === cible.livre && s.section === cible.section)) return null;
  const nouveau = copie(personnage);
  nouveau.quetes[index].sections.push(cible);
  return nouveau;
}

export function retirerSectionQuete(personnage, index, rang) {
  if (!dansListe(personnage.quetes, index) || !dansListe(personnage.quetes[index].sections, rang)) return null;
  const nouveau = copie(personnage);
  nouveau.quetes[index].sections.splice(rang, 1);
  return nouveau;
}

// Une note ne s'ajoute que si son texte (espaces de bord retirés) est non vide ; elle porte le livre et la section
// en cours et sa date. Les retours à la ligne intérieurs restent.
export function ajouterNote(personnage, texteSaisi, maintenant = new Date()) {
  const texte = String(texteSaisi ?? '').trim();
  if (texte === '') return null;
  const nouveau = copie(personnage);
  const { livre, section } = personnage.section_en_cours;
  nouveau.notes.push({ texte, livre, section, ecrite_le: maintenant.toISOString() });
  return nouveau;
}

// La saisie d'un adversaire : le nom (espaces de bord retirés) non vide, le Combat, la Défense et l'Endurance entiers
// ≥ 0 ; sinon null.
function adversaireSaisi(saisie) {
  const nom = String(saisie?.nom ?? '').trim();
  const nombres = ['combat', 'defense', 'endurance'].map((champ) => entierSaisi(saisie?.[champ]));
  if (nom === '' || nombres.some((n) => n === null || n < 0)) return null;
  const [combat, defenseSaisie, endurance] = nombres;
  return { nom, combat, defense: defenseSaisie, endurance };
}

// Un adversaire s'ajoute à la fin des combats, avec le livre et la section en cours, son Endurance pleine.
export function ajouterAdversaire(personnage, saisie) {
  const lu = adversaireSaisi(saisie);
  if (lu === null) return null;
  const nouveau = copie(personnage);
  const { livre, section } = personnage.section_en_cours;
  nouveau.combats.push({
    nom: lu.nom, combat: lu.combat, defense: lu.defense, endurance: { max: lu.endurance, actuelle: lu.endurance }, livre, section, termine: false,
  });
  return nouveau;
}

// Le nom, le Combat, la Défense et l'Endurance maximale changent ; l'actuelle ne dépasse pas le nouveau maximum.
export function modifierAdversaire(personnage, index, saisie) {
  const lu = adversaireSaisi(saisie);
  if (lu === null || !dansListe(personnage.combats, index)) return null;
  const nouveau = copie(personnage);
  const adversaire = nouveau.combats[index];
  adversaire.nom = lu.nom;
  adversaire.combat = lu.combat;
  adversaire.defense = lu.defense;
  adversaire.endurance.max = lu.endurance;
  adversaire.endurance.actuelle = Math.min(adversaire.endurance.actuelle, lu.endurance);
  return nouveau;
}

// L'Endurance actuelle d'un adversaire reste dans [0, max], comme celle du personnage.
export function changerEnduranceAdversaire(personnage, index, delta) {
  if (!dansListe(personnage.combats, index)) return null;
  const { max, actuelle } = personnage.combats[index].endurance;
  const cible = actuelle + delta;
  if (cible < 0 || cible > max) return null;
  const nouveau = copie(personnage);
  nouveau.combats[index].endurance.actuelle = cible;
  return nouveau;
}

// « Fin du combat » : le combat passe dans les combats passés ; déjà terminé ou index hors de la liste → null.
export function finirCombat(personnage, index) {
  if (!dansListe(personnage.combats, index) || personnage.combats[index].termine) return null;
  const nouveau = copie(personnage);
  nouveau.combats[index].termine = true;
  return nouveau;
}
