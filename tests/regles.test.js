// Lot v0.3 — tests des règles de calcul de la feuille d'aventure et de leurs bornes (js/regles.js).
// Lot v0.6 — les transformations du journal : la section en cours et le chemin, les quêtes, les notes, les combats.
// Lot v0.7 — les listes du livret (js/livret.js), les codes et les cases de section, les codes liés d'une quête.
// Lot v0.8 — les biens : les lieux (stockées, investissements, dépôts), leurs sommes et leurs objets, le navire.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  CIBLES,
  COMPETENCES,
  EQUIPAGES,
  MAX_HISTORIQUE,
  MAX_POSSESSIONS,
  acquerirNavire,
  ajouterAdversaire,
  ajouterBonus,
  ajouterCargaison,
  ajouterCodeQuete,
  ajouterEntree,
  ajouterLieu,
  ajouterNote,
  ajouterObjetStocke,
  ajouterPossession,
  ajouterQuete,
  ajouterSectionQuete,
  ajouterTitre,
  allerSection,
  basculerCode,
  bonusObjets,
  changerBase,
  changerBonusObjet,
  changerBourse,
  changerEndurance,
  changerEnduranceAdversaire,
  changerEnduranceMax,
  changerNiveau,
  changerSomme,
  cocherCase,
  defense,
  entierSaisi,
  feuilleLibre,
  finirCombat,
  modifierAdversaire,
  modifierLieu,
  modifierNavire,
  modifierQuete,
  operationBourse,
  rangsCoches,
  retirerBonus,
  retirerCargaison,
  retirerCodeQuete,
  retirerDeListe,
  retirerNavire,
  retirerObjetStocke,
  retirerSectionQuete,
  signe,
  totalCompetence,
} from '../js/regles.js';
import { LIVRETS, lignesDeSection } from '../js/livret.js';
import { personnageNeuf } from '../js/sauvegarde.js';

const MAINTENANT = new Date('2026-10-24T10:00:00.000Z');

// Un personnage de niveau 2, Combat 5, Endurance 6 / 9, Bourse 10.
function perso() {
  const p = personnageNeuf('Essai', 'Guerrière', MAINTENANT, 'id-essai');
  p.niveau = 2;
  p.endurance = { max: 9, actuelle: 6 };
  p.bourse = 10;
  for (const code of COMPETENCES) p.competences[code] = { initiale: 3, actuelle: 3, bonus: [] };
  p.competences.combat = { initiale: 5, actuelle: 5, bonus: [] };
  return p;
}

test('COMPETENCES dans l\'ordre de la feuille, MAX_POSSESSIONS = 12', () => {
  assert.deepEqual(COMPETENCES, ['charisme', 'combat', 'magie', 'piete', 'exploration', 'adresse']);
  assert.equal(MAX_POSSESSIONS, 12);
});

test('totalCompetence sans bonus : la base actuelle', () => {
  assert.equal(totalCompetence(perso(), 'combat'), 5);
});

test('totalCompetence avec un bonus et un malus', () => {
  const p = perso();
  p.competences.combat.bonus = [{ valeur: 2, raison: 'Épée' }, { valeur: -1, raison: 'Blessure' }];
  assert.equal(totalCompetence(p, 'combat'), 6);
});

test('totalCompetence peut être négatif', () => {
  const p = perso();
  p.competences.magie = { initiale: 1, actuelle: 1, bonus: [{ valeur: -3, raison: 'Malédiction' }] };
  assert.equal(totalCompetence(p, 'magie'), -2);
  assert.equal(signe(totalCompetence(p, 'magie')), '−2');
});

test('defense = niveau + base actuelle de Combat + bonus de Défense', () => {
  const p = perso();
  assert.equal(defense(p), 7);
  p.defense.bonus = [{ valeur: 1, raison: 'Gilet en cuir' }, { valeur: -1, raison: 'Fiche de l\'éditeur' }, { valeur: 3, raison: 'Cotte' }];
  assert.equal(defense(p), 10);
});

test('defense : un bonus de Combat n\'y entre pas', () => {
  const p = perso();
  p.competences.combat.bonus = [{ valeur: 4, raison: 'Épée' }];
  assert.equal(totalCompetence(p, 'combat'), 9);
  assert.equal(defense(p), 7);
});

test('signe : +n, −n (U+2212), 0', () => {
  assert.equal(signe(3), '+3');
  assert.equal(signe(-2), '−2');
  assert.equal(signe(0), '0');
});

test('Endurance : « + » monte, « − » descend', () => {
  assert.equal(changerEndurance(perso(), 1).endurance.actuelle, 7);
  assert.equal(changerEndurance(perso(), -1).endurance.actuelle, 5);
});

test('Endurance : « + » au maximum et « − » à 0 ne font rien', () => {
  const plein = perso();
  plein.endurance.actuelle = 9;
  assert.equal(changerEndurance(plein, 1), null);
  const vide = perso();
  vide.endurance.actuelle = 0;
  assert.equal(changerEndurance(vide, -1), null);
});

test('Endurance maximale : reste ≥ 0 ; la baisser sous l\'actuelle ramène l\'actuelle au maximum', () => {
  const p = perso();
  p.endurance = { max: 6, actuelle: 6 };
  assert.deepEqual(changerEnduranceMax(p, -1).endurance, { max: 5, actuelle: 5 });
  assert.deepEqual(changerEnduranceMax(perso(), -1).endurance, { max: 8, actuelle: 6 });
  assert.deepEqual(changerEnduranceMax(perso(), 1).endurance, { max: 10, actuelle: 6 });
  const zero = perso();
  zero.endurance = { max: 0, actuelle: 0 };
  assert.equal(changerEnduranceMax(zero, -1), null);
});

test('Niveau : reste ≥ 1', () => {
  assert.equal(changerNiveau(perso(), 1).niveau, 3);
  assert.equal(changerNiveau(perso(), -1).niveau, 1);
  const un = perso();
  un.niveau = 1;
  assert.equal(changerNiveau(un, -1), null);
});

test('Base d\'une compétence : reste ≥ 0, l\'initiale ne change jamais', () => {
  const monte = changerBase(perso(), 'combat', 1);
  assert.deepEqual([monte.competences.combat.initiale, monte.competences.combat.actuelle], [5, 6]);
  const p = perso();
  p.competences.magie.actuelle = 0;
  assert.equal(changerBase(p, 'magie', -1), null);
  const baisse = changerBase(perso(), 'combat', -1);
  assert.deepEqual([baisse.competences.combat.initiale, baisse.competences.combat.actuelle], [5, 4]);
});

test('Bonus : s\'ajoute avec une valeur entière non nulle et une raison (bords retirés)', () => {
  const p = ajouterBonus(perso(), 'combat', '1', '  Épée ');
  assert.deepEqual(p.competences.combat.bonus, [{ valeur: 1, raison: 'Épée' }]);
  const d = ajouterBonus(perso(), 'defense', '-1', 'Fatigue');
  assert.deepEqual(d.defense.bonus, [{ valeur: -1, raison: 'Fatigue' }]);
});

test('Bonus : valeur nulle, non entière ou vide, ou raison vide → rien ne s\'ajoute', () => {
  for (const [valeur, raison] of [['0', 'Épée'], ['', 'Épée'], ['1.5', 'Épée'], ['abc', 'Épée'], ['2', ''], ['2', '   ']]) {
    assert.equal(ajouterBonus(perso(), 'combat', valeur, raison), null, `${valeur} / ${raison}`);
  }
});

test('Bonus : retirer le bon, l\'ordre gardé', () => {
  let p = ajouterBonus(perso(), 'combat', '1', 'A');
  p = ajouterBonus(p, 'combat', '2', 'B');
  assert.deepEqual(retirerBonus(p, 'combat', 0).competences.combat.bonus, [{ valeur: 2, raison: 'B' }]);
  assert.equal(retirerBonus(p, 'combat', 5), null);
});

test('Bourse : « − » et « + » ; elle reste ≥ 0', () => {
  assert.equal(changerBourse(perso(), 1).bourse, 11);
  assert.equal(changerBourse(perso(), -1).bourse, 9);
  const vide = perso();
  vide.bourse = 0;
  assert.equal(changerBourse(vide, -1), null);
});

test('Bourse : « Gagner » et « Dépenser » un montant entier ≥ 1', () => {
  assert.equal(operationBourse(perso(), 'gagner', '5').personnage.bourse, 15);
  const depense = operationBourse(perso(), 'depenser', '10');
  assert.equal(depense.issue, 'ok');
  assert.equal(depense.personnage.bourse, 0);
  for (const montant of ['', '0', '-3', '2.5', 'x']) {
    assert.deepEqual(operationBourse(perso(), 'gagner', montant), { issue: 'invalide' }, montant);
    assert.deepEqual(operationBourse(perso(), 'depenser', montant), { issue: 'invalide' }, montant);
  }
});

test('Bourse : dépenser plus que la Bourse est refusé', () => {
  const p = perso();
  assert.deepEqual(operationBourse(p, 'depenser', '11'), { issue: 'insuffisante' });
  assert.equal(p.bourse, 10);
});

test('Possessions : s\'ajoutent à la suite, doublons permis, texte vide refusé', () => {
  let p = ajouterPossession(perso(), ' Corde ');
  p = ajouterPossession(p, 'Corde');
  assert.deepEqual(p.possessions, [{ texte: 'Corde', bonus: null }, { texte: 'Corde', bonus: null }]);
  assert.equal(ajouterPossession(perso(), '   '), null);
});

test('Possessions : à 12, plus rien ne s\'ajoute ; en retirer une libère une place', () => {
  let p = perso();
  for (let i = 1; i <= 12; i += 1) p = ajouterPossession(p, `Objet ${i}`);
  assert.equal(p.possessions.length, 12);
  assert.equal(ajouterPossession(p, 'De trop'), null);
  const moins = retirerDeListe(p, 'possessions', 0);
  assert.equal(moins.possessions[0].texte, 'Objet 2');
  assert.equal(ajouterPossession(moins, 'Nouveau').possessions[11].texte, 'Nouveau');
});

test('Titres : s\'ajoutent si non vides, se retirent', () => {
  const p = ajouterTitre(perso(), ' Ami des Rangers ');
  assert.deepEqual(p.titres, ['Ami des Rangers']);
  assert.equal(ajouterTitre(perso(), ''), null);
  assert.deepEqual(retirerDeListe(p, 'titres', 0).titres, []);
});

test('Cultes : une entrée demande au moins un champ ; livre et section vides ou non entiers valent null', () => {
  assert.equal(ajouterEntree(perso(), 'benedictions', { origine: ' ', consequences: '' }), null);
  assert.deepEqual(ajouterEntree(perso(), 'benedictions', { origine: 'Alvir', consequences: '' }).benedictions,
    [{ origine: 'Alvir', consequences: '' }]);
  assert.deepEqual(ajouterEntree(perso(), 'resurrections', { origine: '', lieu: 'Marlock', livre: '1', section: '' }).resurrections,
    [{ origine: '', lieu: 'Marlock', livre: 1, section: null }]);
  assert.deepEqual(ajouterEntree(perso(), 'resurrections', { origine: 'Nagil', lieu: '', livre: '1.5', section: '100' }).resurrections,
    [{ origine: 'Nagil', lieu: '', livre: null, section: 100 }]);
});

test('Saisie libre : vide, négatif ou non entier vaut 0, le Niveau au moins 1, l\'Endurance actuelle = maximale', () => {
  const p = feuilleLibre(personnageNeuf('Essai', '', MAINTENANT, 'x'), {
    niveau: '', endurance: '12', bourse: '-4', competences: { combat: '3', magie: '2.5', adresse: 'abc' },
  });
  assert.equal(p.niveau, 1);
  assert.deepEqual(p.endurance, { max: 12, actuelle: 12 });
  assert.equal(p.bourse, 0);
  assert.deepEqual(p.competences.combat, { initiale: 3, actuelle: 3, bonus: [] });
  assert.deepEqual(p.competences.magie, { initiale: 0, actuelle: 0, bonus: [] });
  assert.deepEqual(p.competences.adresse, { initiale: 0, actuelle: 0, bonus: [] });
  assert.equal(defense(p), 4);
  assert.equal(feuilleLibre(p, { niveau: '3' }).niveau, 3);
});

test('les règles rendent une copie : le personnage d\'origine ne change pas', () => {
  const p = perso();
  const avant = structuredClone(p);
  changerEndurance(p, -1);
  ajouterBonus(p, 'combat', '1', 'Épée');
  ajouterPossession(p, 'Corde');
  operationBourse(p, 'depenser', '3');
  assert.deepEqual(p, avant);
});

test('entierSaisi : un entier, ou null', () => {
  assert.equal(entierSaisi(' 7 '), 7);
  assert.equal(entierSaisi('-2'), -2);
  assert.equal(entierSaisi(''), null);
  assert.equal(entierSaisi('2.5'), null);
  assert.equal(entierSaisi('x'), null);
});

// ---- Lot v0.4 — le bonus des objets -------------------------------------------------------------------------

// Le personnage d'essai, avec ces possessions : [texte, cible, valeur] ou [texte] (sans bonus).
function avecObjets(...objets) {
  const p = perso();
  p.possessions = objets.map(([texte, cible, valeur]) => ({ texte, bonus: cible === undefined ? null : { cible, valeur } }));
  return p;
}

test('CIBLES : les six compétences dans l\'ordre de COMPETENCES, puis la Défense', () => {
  assert.deepEqual(CIBLES, [...COMPETENCES, 'defense']);
});

test('bonusObjets : un seul bonus compte, avec son texte et sa place', () => {
  const p = avecObjets(['Corde'], ['Épée', 'combat', 1]);
  assert.deepEqual(bonusObjets(p, 'combat'), [{ valeur: 1, raison: 'Épée', index: 1, compte: true }]);
});

test('bonusObjets : deux bonus, seul le plus grand compte', () => {
  const p = avecObjets(['Lance', 'combat', 1], ['Épée enchantée', 'combat', 2]);
  assert.deepEqual(bonusObjets(p, 'combat'), [
    { valeur: 1, raison: 'Lance', index: 0, compte: false },
    { valeur: 2, raison: 'Épée enchantée', index: 1, compte: true },
  ]);
});

test('bonusObjets : à égalité, le premier dans la liste compte', () => {
  const p = avecObjets(['Épée', 'combat', 2], ['Hache', 'combat', 2]);
  assert.deepEqual(bonusObjets(p, 'combat').map((b) => b.compte), [true, false]);
});

test('bonusObjets : un malus compte toujours, à côté du meilleur bonus', () => {
  const p = avecObjets(['Anneau terni', 'charisme', -1], ['Broche', 'charisme', 1], ['Collier', 'charisme', 2], ['Masque', 'charisme', -2]);
  assert.deepEqual(bonusObjets(p, 'charisme').map((b) => [b.raison, b.compte]),
    [['Anneau terni', true], ['Broche', false], ['Collier', true], ['Masque', true]]);
});

test('bonusObjets : un objet d\'une autre cible, ou sans bonus, n\'entre pas', () => {
  const p = avecObjets(['Gilet en cuir', 'defense', 1], ['Corde'], ['Boussole', 'exploration', 1]);
  assert.deepEqual(bonusObjets(p, 'combat'), []);
  assert.deepEqual(bonusObjets(p, 'defense').map((b) => b.raison), ['Gilet en cuir']);
  assert.deepEqual(bonusObjets(perso(), 'defense'), []);
});

test('totalCompetence avec objets : base + bonus à la main + objets qui comptent', () => {
  const p = avecObjets(['Lance', 'combat', 1], ['Épée', 'combat', 3], ['Bracelet maudit', 'combat', -1]);
  p.competences.combat.bonus = [{ valeur: 1, raison: 'Bénédiction' }];
  assert.equal(totalCompetence(p, 'combat'), 5 + 1 + 3 - 1);
  assert.equal(totalCompetence(p, 'magie'), 3);
});

test('defense avec objets ; un bonus d\'objet de Combat n\'entre pas dans la Défense', () => {
  const p = avecObjets(['Épée', 'combat', 4], ['Gilet en cuir', 'defense', 1], ['Cotte de mailles', 'defense', 3]);
  p.defense.bonus = [{ valeur: -1, raison: 'Fatigue' }];
  assert.equal(totalCompetence(p, 'combat'), 9);
  assert.equal(defense(p), 2 + 5 - 1 + 3);
});

test('ajouterPossession avec un bonus valide ; cible vide : sans bonus', () => {
  assert.deepEqual(ajouterPossession(perso(), ' Épée enchantée ', 'combat', '2').possessions,
    [{ texte: 'Épée enchantée', bonus: { cible: 'combat', valeur: 2 } }]);
  assert.deepEqual(ajouterPossession(perso(), 'Gilet', 'defense', '-1').possessions, [{ texte: 'Gilet', bonus: { cible: 'defense', valeur: -1 } }]);
  assert.deepEqual(ajouterPossession(perso(), 'Corde', '', 'n\'importe quoi').possessions, [{ texte: 'Corde', bonus: null }]);
});

test('ajouterPossession : cible inconnue, valeur 0, non entière ou vide → rien ne s\'ajoute', () => {
  for (const [cible, valeur] of [['chance', '1'], ['combat', '0'], ['combat', '1.5'], ['combat', 'abc'], ['combat', '']]) {
    assert.equal(ajouterPossession(perso(), 'Épée', cible, valeur), null, `${cible} / ${valeur}`);
  }
});

test('changerBonusObjet : changer le bonus, le retirer (cible vide) ; le texte ne change pas', () => {
  const p = avecObjets(['Corde'], ['Lance', 'combat', 1]);
  assert.deepEqual(changerBonusObjet(p, 1, 'defense', '2').possessions[1], { texte: 'Lance', bonus: { cible: 'defense', valeur: 2 } });
  assert.deepEqual(changerBonusObjet(p, 1, '', '1').possessions[1], { texte: 'Lance', bonus: null });
  assert.deepEqual(changerBonusObjet(p, 0, 'adresse', '-1').possessions[0], { texte: 'Corde', bonus: { cible: 'adresse', valeur: -1 } });
  assert.deepEqual(p.possessions[1], { texte: 'Lance', bonus: { cible: 'combat', valeur: 1 } });
});

test('changerBonusObjet : index hors de la liste ou saisie invalide → null', () => {
  const p = avecObjets(['Lance', 'combat', 1]);
  for (const index of [-1, 1, 7]) assert.equal(changerBonusObjet(p, index, 'combat', '2'), null, String(index));
  for (const [cible, valeur] of [['chance', '1'], ['combat', '0'], ['combat', '2.5'], ['combat', '']]) {
    assert.equal(changerBonusObjet(p, 0, cible, valeur), null, `${cible} / ${valeur}`);
  }
});

test('retirer un objet retire son bonus du total', () => {
  const p = avecObjets(['Lance', 'combat', 1], ['Épée enchantée', 'combat', 2]);
  assert.equal(totalCompetence(p, 'combat'), 7);
  const sans = retirerDeListe(p, 'possessions', 1);
  assert.deepEqual(sans.possessions, [{ texte: 'Lance', bonus: { cible: 'combat', valeur: 1 } }]);
  assert.equal(totalCompetence(sans, 'combat'), 6);
});

// ---- Lot v0.6 — le journal ----------------------------------------------------------------------------------

// Le personnage d'essai à la section 192 du livre 1, avec deux sections au chemin.
function enRoute() {
  const p = perso();
  p.section_en_cours = { livre: 1, section: 192 };
  p.historique = [{ livre: 1, section: 1 }, { livre: 1, section: 163 }];
  return p;
}

test('MAX_HISTORIQUE vaut 200', () => {
  assert.equal(MAX_HISTORIQUE, 200);
});

test('allerSection : la section quittée entre à la fin du chemin, la section en cours change', () => {
  const p = enRoute();
  const apres = allerSection(p, '1', ' 205 ');
  assert.deepEqual(apres.section_en_cours, { livre: 1, section: 205 });
  assert.deepEqual(apres.historique, [{ livre: 1, section: 1 }, { livre: 1, section: 163 }, { livre: 1, section: 192 }]);
  assert.deepEqual(allerSection(p, 2, 10).section_en_cours, { livre: 2, section: 10 });
  assert.deepEqual(p.section_en_cours, { livre: 1, section: 192 });
  assert.equal(p.historique.length, 2);
});

test('allerSection : la même section → null ; le même numéro dans un autre livre change', () => {
  const p = enRoute();
  assert.equal(allerSection(p, '1', '192'), null);
  assert.deepEqual(allerSection(p, '2', '192').section_en_cours, { livre: 2, section: 192 });
});

test('allerSection : saisie vide, 0, négative ou non entière → null', () => {
  const p = enRoute();
  for (const [livre, section] of [['1', ''], ['', '12'], ['1', '0'], ['0', '12'], ['1', '-3'], ['1', '2.5'], ['un', '12'], [null, undefined]]) {
    assert.equal(allerSection(p, livre, section), null, `${livre} / ${section}`);
  }
});

test('allerSection : une section en cours null n\'entre pas au chemin', () => {
  const p = enRoute();
  p.section_en_cours = { livre: 1, section: null };
  const apres = allerSection(p, '1', '15');
  assert.deepEqual(apres.section_en_cours, { livre: 1, section: 15 });
  assert.deepEqual(apres.historique, p.historique);
});

test('allerSection : à 200 entrées, la plus ancienne sort', () => {
  const p = enRoute();
  p.historique = Array.from({ length: 200 }, (_, i) => ({ livre: 1, section: i + 1 }));
  const apres = allerSection(p, '1', '400');
  assert.equal(apres.historique.length, 200);
  assert.deepEqual(apres.historique[0], { livre: 1, section: 2 });
  assert.deepEqual(apres.historique.at(-1), { livre: 1, section: 192 });
});

test('ajouterQuete : titre aux espaces de bord retirés ; titre vide → null', () => {
  const p = perso();
  const apres = ajouterQuete(p, '  Trouver un passeur ');
  assert.deepEqual(apres.quetes, [{ titre: 'Trouver un passeur', personnages: '', sections: [], codes: [], terminee: false }]);
  for (const titre of ['', '   ', null, undefined]) assert.equal(ajouterQuete(p, titre), null, String(titre));
  assert.deepEqual(p.quetes, []);
});

test('modifierQuete : titre, personnages, terminee ; titre vide ou index hors de la liste → null', () => {
  const p = ajouterQuete(ajouterQuete(perso(), 'Une'), 'Deux');
  const apres = modifierQuete(p, 1, { titre: ' Deux bis ', personnages: ' Orlo ', terminee: true });
  assert.deepEqual(apres.quetes[1], { titre: 'Deux bis', personnages: 'Orlo', sections: [], codes: [], terminee: true });
  assert.deepEqual(apres.quetes[0], p.quetes[0]);
  assert.equal(modifierQuete(apres, 1, { terminee: false }).quetes[1].terminee, false);
  assert.equal(modifierQuete(p, 0, { personnages: '' }).quetes[0].personnages, '');
  assert.equal(modifierQuete(p, 0, { titre: '  ' }), null);
  for (const index of [-1, 2, 9]) assert.equal(modifierQuete(p, index, { terminee: true }), null, String(index));
});

test('ajouterSectionQuete : à la fin ; doublon, saisie invalide ou index hors de la liste → null', () => {
  const p = ajouterQuete(perso(), 'Une');
  const une = ajouterSectionQuete(p, 0, '1', '112');
  const deux = ajouterSectionQuete(une, 0, '1', '87');
  assert.deepEqual(deux.quetes[0].sections, [{ livre: 1, section: 112 }, { livre: 1, section: 87 }]);
  assert.equal(ajouterSectionQuete(deux, 0, '1', '112'), null);
  assert.deepEqual(ajouterSectionQuete(deux, 0, '2', '112').quetes[0].sections.at(-1), { livre: 2, section: 112 });
  assert.equal(ajouterSectionQuete(p, 0, '1', ''), null);
  assert.equal(ajouterSectionQuete(p, 0, '0', '5'), null);
  assert.equal(ajouterSectionQuete(p, 1, '1', '5'), null);
});

test('retirerSectionQuete : retire le rang ; index ou rang hors de la liste → null', () => {
  const p = ajouterSectionQuete(ajouterSectionQuete(ajouterQuete(perso(), 'Une'), 0, 1, 112), 0, 1, 87);
  assert.deepEqual(retirerSectionQuete(p, 0, 0).quetes[0].sections, [{ livre: 1, section: 87 }]);
  for (const [index, rang] of [[0, 2], [0, -1], [1, 0], [-1, 0]]) assert.equal(retirerSectionQuete(p, index, rang), null, `${index} / ${rang}`);
});

test('ajouterNote : le livre, la section en cours et la date ; texte vide → null ; les retours à la ligne restent', () => {
  const p = enRoute();
  const maintenant = new Date('2026-10-25T17:20:00.000Z');
  const apres = ajouterNote(p, '  Le temple.\nDix chardes.  ', maintenant);
  assert.deepEqual(apres.notes, [{ texte: 'Le temple.\nDix chardes.', livre: 1, section: 192, ecrite_le: '2026-10-25T17:20:00.000Z' }]);
  for (const texte of ['', ' \n ', null]) assert.equal(ajouterNote(p, texte, maintenant), null, String(texte));
  p.section_en_cours = { livre: 1, section: null };
  assert.deepEqual(ajouterNote(p, 'Sans section', maintenant).notes[0], { texte: 'Sans section', livre: 1, section: null, ecrite_le: '2026-10-25T17:20:00.000Z' });
});

test('ajouterAdversaire : valide, avec la section en cours et l\'Endurance pleine', () => {
  const p = enRoute();
  const apres = ajouterAdversaire(p, { nom: ' Garde corrompu ', combat: '6', defense: '9', endurance: '14' });
  assert.deepEqual(apres.combats, [{
    nom: 'Garde corrompu', combat: 6, defense: 9, endurance: { max: 14, actuelle: 14 }, livre: 1, section: 192, termine: false,
  }]);
  assert.deepEqual(ajouterAdversaire(p, { nom: 'Rat', combat: '0', defense: '0', endurance: '0' }).combats[0].endurance, { max: 0, actuelle: 0 });
});

test('ajouterAdversaire : nom vide, nombre vide, négatif ou non entier → null', () => {
  const p = perso();
  const bon = { nom: 'Loup', combat: '4', defense: '6', endurance: '9' };
  assert.notEqual(ajouterAdversaire(p, bon), null);
  for (const [champ, valeur] of [['nom', ''], ['nom', '  '], ['combat', ''], ['combat', '-1'], ['defense', '2.5'], ['endurance', 'neuf'], ['endurance', '-4']]) {
    assert.equal(ajouterAdversaire(p, { ...bon, [champ]: valeur }), null, `${champ} = ${valeur}`);
  }
});

test('modifierAdversaire : nom et chiffres changent ; l\'actuelle ramenée sous le nouveau maximum ; invalide → null', () => {
  const p = ajouterAdversaire(enRoute(), { nom: 'Loup', combat: '4', defense: '6', endurance: '9' });
  p.combats[0].endurance.actuelle = 7;
  const plus = modifierAdversaire(p, 0, { nom: 'Grand loup', combat: '5', defense: '7', endurance: '12' });
  assert.deepEqual(plus.combats[0], { ...p.combats[0], nom: 'Grand loup', combat: 5, defense: 7, endurance: { max: 12, actuelle: 7 } });
  assert.deepEqual(modifierAdversaire(p, 0, { nom: 'Loup', combat: '4', defense: '6', endurance: '5' }).combats[0].endurance, { max: 5, actuelle: 5 });
  assert.equal(modifierAdversaire(p, 0, { nom: '', combat: '4', defense: '6', endurance: '5' }), null);
  assert.equal(modifierAdversaire(p, 1, { nom: 'Loup', combat: '4', defense: '6', endurance: '5' }), null);
});

test('changerEnduranceAdversaire : reste dans [0, max] ; aux deux bornes → null', () => {
  const p = ajouterAdversaire(perso(), { nom: 'Loup', combat: '4', defense: '6', endurance: '2' });
  assert.equal(changerEnduranceAdversaire(p, 0, 1), null);
  const un = changerEnduranceAdversaire(p, 0, -1);
  assert.equal(un.combats[0].endurance.actuelle, 1);
  const zero = changerEnduranceAdversaire(un, 0, -1);
  assert.equal(zero.combats[0].endurance.actuelle, 0);
  assert.equal(changerEnduranceAdversaire(zero, 0, -1), null);
  assert.equal(changerEnduranceAdversaire(zero, 0, 1).combats[0].endurance.actuelle, 1);
  assert.equal(changerEnduranceAdversaire(p, 3, -1), null);
});

test('finirCombat : termine devient true ; deux fois, ou index hors de la liste → null', () => {
  const p = ajouterAdversaire(perso(), { nom: 'Loup', combat: '4', defense: '6', endurance: '9' });
  const fini = finirCombat(p, 0);
  assert.equal(fini.combats[0].termine, true);
  assert.equal(p.combats[0].termine, false);
  assert.equal(finirCombat(fini, 0), null);
  assert.equal(finirCombat(p, 1), null);
});

test('retirerDeListe sert aussi pour les quêtes, les notes et les combats', () => {
  let p = ajouterQuete(ajouterQuete(perso(), 'Une'), 'Deux');
  p = ajouterNote(p, 'Note', MAINTENANT);
  p = ajouterAdversaire(p, { nom: 'Loup', combat: '4', defense: '6', endurance: '9' });
  assert.deepEqual(retirerDeListe(p, 'quetes', 0).quetes.map((q) => q.titre), ['Deux']);
  assert.deepEqual(retirerDeListe(p, 'notes', 0).notes, []);
  assert.deepEqual(retirerDeListe(p, 'combats', 0).combats, []);
  assert.equal(retirerDeListe(p, 'combats', 1), null);
});

// ---- Lot v0.7 — les listes du livret ------------------------------------------------------------------------

test('LIVRETS : l\'équivalence (1 814 caractères, sha256) ; seul le livre 1', () => {
  const texte = JSON.stringify(LIVRETS);
  assert.equal(texte.length, 1814);
  assert.equal(createHash('sha256').update(texte, 'utf8').digest('hex'), 'f677fe3fa4f65edf9fce992594c43944404e4f3309f1c21e229bd8dcca241f1b');
  assert.deepEqual(Object.keys(LIVRETS), ['1']);
});

test('LIVRETS : 35 codes, 37 lignes, 42 cases', () => {
  const { codes, cases } = LIVRETS[1];
  assert.equal(codes.length, 35);
  assert.equal(new Set(codes).size, 35);
  assert.equal(cases.length, 37);
  assert.equal(cases.reduce((n, ligne) => n + ligne.cases, 0), 42);
});

test('lignesDeSection : les deux lignes de la section 10 dans l\'ordre ; sans ligne ou sans livret → []', () => {
  assert.deepEqual(lignesDeSection(1, 10), [{ section: 10, libelle: '', cases: 4 }, { section: 10, libelle: 'chez_vous', cases: 1 }]);
  assert.deepEqual(lignesDeSection(1, 116), [{ section: 116, libelle: '', cases: 1 }]);
  assert.deepEqual(lignesDeSection(1, 192), []);
  assert.deepEqual(lignesDeSection(2, 10), []);
});

// ---- Lot v0.7 — les codes ---------------------------------------------------------------------------------

test('basculerCode : absent → ajouté à la fin ; présent → retiré ; l\'origine ne change pas', () => {
  const p = perso();
  const un = basculerCode(p, 'Azur');
  const deux = basculerCode(un, 'Aide');
  assert.deepEqual(deux.codes, ['Azur', 'Aide']);
  assert.deepEqual(basculerCode(deux, 'Azur').codes, ['Aide']);
  assert.deepEqual(p.codes, []);
  assert.deepEqual(un.codes, ['Azur']);
});

test('basculerCode : un code vide ou qui n\'est pas une chaîne → null', () => {
  const p = perso();
  for (const code of ['', null, undefined, 3, ['Aide']]) assert.equal(basculerCode(p, code), null, String(code));
});

// ---- Lot v0.7 — les cases de section ----------------------------------------------------------------------

test('cocherCase : une case au milieu se coche seule ; les rangs triés ; la ligne réécrite à la fin', () => {
  const p = perso();
  p.cases = [{ livre: 1, section: 19, libelle: '', rangs: [0] }, { livre: 1, section: 91, libelle: '', rangs: [0] }];
  const apres = cocherCase(p, 1, 19, '', 3, 2, true);
  assert.deepEqual(apres.cases, [{ livre: 1, section: 91, libelle: '', rangs: [0] }, { livre: 1, section: 19, libelle: '', rangs: [0, 2] }]);
  const milieu = cocherCase(apres, 1, 19, '', 3, 1, true);
  assert.deepEqual(milieu.cases.at(-1).rangs, [0, 1, 2]);
  assert.deepEqual(p.cases[0].rangs, [0]);
  const neuve = cocherCase(p, 1, 10, 'chez_vous', 1, 0, true);
  assert.deepEqual(neuve.cases.at(-1), { livre: 1, section: 10, libelle: 'chez_vous', rangs: [0] });
  assert.deepEqual(rangsCoches(neuve, 1, 10, '', 4), []);
});

test('cocherCase : décocher la dernière case retire la ligne ; un champ inconnu d\'une ligne gardée reste', () => {
  const p = perso();
  p.cases = [{ livre: 1, section: 19, libelle: '', rangs: [0, 2], note: 'x' }, { livre: 1, section: 91, libelle: '', rangs: [0] }];
  assert.deepEqual(cocherCase(p, 1, 91, '', 1, 0, false).cases, [p.cases[0]]);
  assert.deepEqual(cocherCase(p, 1, 19, '', 3, 0, false).cases.at(-1), { livre: 1, section: 19, libelle: '', rangs: [2], note: 'x' });
});

test('cocherCase : rang hors de [0, max[ ou non entier → null ; déjà dans l\'état demandé → null', () => {
  const p = perso();
  p.cases = [{ livre: 1, section: 19, libelle: '', rangs: [0] }];
  for (const rang of [-1, 3, 1.5, '1', null]) assert.equal(cocherCase(p, 1, 19, '', 3, rang, true), null, String(rang));
  assert.equal(cocherCase(p, 1, 19, '', 3, 0, true), null);
  assert.equal(cocherCase(p, 1, 19, '', 3, 1, false), null);
  assert.equal(cocherCase(p, 1, 91, '', 1, 0, false), null);
});

test('rangsCoches : les rangs < max, croissants ; [] sans la ligne ; le libellé distingue les lignes', () => {
  const p = perso();
  p.cases = [{ livre: 1, section: 10, libelle: '', rangs: [0, 3, 5] }, { livre: 1, section: 10, libelle: 'chez_vous', rangs: [0] }];
  assert.deepEqual(rangsCoches(p, 1, 10, '', 4), [0, 3]);
  assert.deepEqual(rangsCoches(p, 1, 10, 'chez_vous', 1), [0]);
  assert.deepEqual(rangsCoches(p, 1, 19, '', 3), []);
  assert.deepEqual(rangsCoches(p, 2, 10, '', 4), []);
});

// ---- Lot v0.7 — les codes liés d'une quête ----------------------------------------------------------------

test('ajouterCodeQuete : à la fin ; doublon, code vide ou index hors de la liste → null', () => {
  const p = ajouterQuete(ajouterQuete(perso(), 'Une'), 'Deux');
  const un = ajouterCodeQuete(p, 1, 'Alissia');
  const deux = ajouterCodeQuete(un, 1, 'Aide');
  assert.deepEqual(deux.quetes[1].codes, ['Alissia', 'Aide']);
  assert.deepEqual(deux.quetes[0].codes, []);
  assert.deepEqual(p.quetes[1].codes, []);
  assert.equal(ajouterCodeQuete(deux, 1, 'Aide'), null);
  for (const code of ['', null, 4]) assert.equal(ajouterCodeQuete(p, 0, code), null, String(code));
  for (const index of [-1, 2, 9]) assert.equal(ajouterCodeQuete(p, index, 'Aide'), null, String(index));
});

test('retirerCodeQuete : retire le rang ; index ou rang hors de la liste → null', () => {
  const p = ajouterCodeQuete(ajouterCodeQuete(ajouterQuete(perso(), 'Une'), 0, 'Aide'), 0, 'Alissia');
  assert.deepEqual(retirerCodeQuete(p, 0, 0).quetes[0].codes, ['Alissia']);
  assert.deepEqual(p.quetes[0].codes, ['Aide', 'Alissia']);
  for (const [index, rang] of [[0, 2], [0, -1], [1, 0], [-1, 0]]) assert.equal(retirerCodeQuete(p, index, rang), null, `${index} / ${rang}`);
});

// ---- Lot v0.8 — les biens ---------------------------------------------------------------------------------

// Un navire saisi : le Brick « La Mouette », équipage moyen, trois unités de cargaison au plus.
const NAVIRE = { nom: ' La Mouette ', type: 'Brick', equipage: 'moyen', cargaison_max: '3', amarrage: 'Le port' };

test('EQUIPAGES : mauvais, moyen, bon, hors-pair', () => {
  assert.deepEqual(EQUIPAGES, ['mauvais', 'moyen', 'bon', 'hors-pair']);
});

test('ajouterLieu : la forme exacte de l\'entrée pour chacune des trois listes, clés dans l\'ordre ; à la fin', () => {
  const p = perso();
  const saisie = { lieu: '  Port  ', livre: '1', section: ' 42 ', somme: '200', conditions: ' Retrait libre ' };
  const stockee = ajouterLieu(p, 'stockees', saisie).stockees;
  assert.deepEqual(stockee, [{ lieu: 'Port', livre: 1, section: 42, objets: [] }]);
  assert.deepEqual(Object.keys(stockee[0]), ['lieu', 'livre', 'section', 'objets']);
  const investissement = ajouterLieu(p, 'investissements', saisie).investissements;
  assert.deepEqual(investissement, [{ lieu: 'Port', livre: 1, section: 42, somme: 200 }]);
  assert.deepEqual(Object.keys(investissement[0]), ['lieu', 'livre', 'section', 'somme']);
  const depot = ajouterLieu(p, 'depots', saisie).depots;
  assert.deepEqual(depot, [{ lieu: 'Port', livre: 1, section: 42, conditions: 'Retrait libre', somme: 200 }]);
  assert.deepEqual(Object.keys(depot[0]), ['lieu', 'livre', 'section', 'conditions', 'somme']);
  const deux = ajouterLieu(ajouterLieu(p, 'depots', saisie), 'depots', { lieu: 'Temple' });
  assert.deepEqual(deux.depots.map((e) => e.lieu), ['Port', 'Temple']);
  assert.deepEqual(p.stockees, []);
});

test('ajouterLieu : lieu vide → null ; livre et section vides ou invalides → null sans refus', () => {
  const p = perso();
  for (const lieu of ['', '   ', undefined]) assert.equal(ajouterLieu(p, 'stockees', { lieu }), null, String(lieu));
  const lu = ajouterLieu(p, 'stockees', { lieu: 'Grotte', livre: '0', section: 'x' }).stockees[0];
  assert.deepEqual(lu, { lieu: 'Grotte', livre: null, section: null, objets: [] });
  assert.deepEqual(ajouterLieu(p, 'depots', { lieu: 'Grotte', livre: '', section: '-3' }).depots[0],
    { lieu: 'Grotte', livre: null, section: null, conditions: '', somme: 0 });
});

test('ajouterLieu : somme vide → 0 ; somme -1 ou non entière → null', () => {
  const p = perso();
  assert.equal(ajouterLieu(p, 'investissements', { lieu: 'Guilde', somme: '' }).investissements[0].somme, 0);
  assert.equal(ajouterLieu(p, 'depots', { lieu: 'Banque', somme: '  ' }).depots[0].somme, 0);
  for (const somme of ['-1', '2.5', 'dix']) {
    assert.equal(ajouterLieu(p, 'investissements', { lieu: 'Guilde', somme }), null, somme);
    assert.equal(ajouterLieu(p, 'depots', { lieu: 'Banque', somme }), null, somme);
  }
});

test('modifierLieu : les champs saisis remplacent ; les objets d\'un lieu de stockage et les champs inconnus restent', () => {
  const p = perso();
  p.stockees = [{ lieu: 'Port', livre: 1, section: 42, objets: ['Corde', 'Lanterne'], cle: 'x' }];
  const apres = modifierLieu(p, 'stockees', 0, { lieu: 'Chambre', livre: '2', section: '' });
  assert.deepEqual(apres.stockees, [{ lieu: 'Chambre', livre: 2, section: null, objets: ['Corde', 'Lanterne'], cle: 'x' }]);
  p.investissements = [{ lieu: 'Guilde', livre: 1, section: 116, somme: 200 }];
  assert.deepEqual(modifierLieu(p, 'investissements', 0, { lieu: 'Guilde', livre: '1', section: '116', somme: '500' }).investissements[0].somme, 500);
  assert.equal(p.stockees[0].lieu, 'Port');
});

test('modifierLieu : index hors de la liste, lieu vide ou somme invalide → null', () => {
  const p = perso();
  p.depots = [{ lieu: 'Banque', livre: 1, section: 192, conditions: '', somme: 150 }];
  for (const index of [-1, 1, 9]) assert.equal(modifierLieu(p, 'depots', index, { lieu: 'Banque' }), null, String(index));
  assert.equal(modifierLieu(p, 'depots', 0, { lieu: '' }), null);
  assert.equal(modifierLieu(p, 'depots', 0, { lieu: 'Banque', somme: '-1' }), null);
});

test('changerSomme : +1 ; −1 sur une somme nulle → null ; index hors de la liste → null', () => {
  const p = perso();
  p.investissements = [{ lieu: 'Guilde', livre: 1, section: 116, somme: 0 }];
  p.depots = [{ lieu: 'Banque', livre: 1, section: 192, conditions: '', somme: 150 }];
  assert.equal(changerSomme(p, 'investissements', 0, 1).investissements[0].somme, 1);
  assert.equal(changerSomme(p, 'investissements', 0, -1), null);
  assert.equal(changerSomme(p, 'depots', 0, -1).depots[0].somme, 149);
  assert.equal(changerSomme(p, 'depots', 1, 1), null);
  assert.equal(p.investissements[0].somme, 0);
});

test('ajouterObjetStocke : à la fin (doublons permis) ; texte vide ou index hors de la liste → null', () => {
  const p = perso();
  p.stockees = [{ lieu: 'Port', livre: 1, section: 42, objets: ['Corde'] }];
  const apres = ajouterObjetStocke(ajouterObjetStocke(p, 0, ' Lanterne '), 0, 'Corde');
  assert.deepEqual(apres.stockees[0].objets, ['Corde', 'Lanterne', 'Corde']);
  assert.deepEqual(p.stockees[0].objets, ['Corde']);
  for (const texte of ['', '   ', undefined]) assert.equal(ajouterObjetStocke(p, 0, texte), null, String(texte));
  for (const index of [-1, 1]) assert.equal(ajouterObjetStocke(p, index, 'Corde'), null, String(index));
});

test('retirerObjetStocke : retire le rang ; index ou rang hors de sa liste → null', () => {
  const p = perso();
  p.stockees = [{ lieu: 'Port', livre: 1, section: 42, objets: ['Corde', 'Lanterne'] }];
  assert.deepEqual(retirerObjetStocke(p, 0, 0).stockees[0].objets, ['Lanterne']);
  for (const [index, rang] of [[0, 2], [0, -1], [1, 0], [-1, 0]]) assert.equal(retirerObjetStocke(p, index, rang), null, `${index} / ${rang}`);
});

test('acquerirNavire : la forme exacte ; un second → null ; équipage inconnu, nom vide ou cargaison invalide → null', () => {
  const p = perso();
  const avec = acquerirNavire(p, NAVIRE);
  assert.deepEqual(avec.navire, { nom: 'La Mouette', type: 'Brick', equipage: 'moyen', cargaison_max: 3, amarrage: 'Le port', cargaison: [] });
  assert.deepEqual(Object.keys(avec.navire), ['nom', 'type', 'equipage', 'cargaison_max', 'amarrage', 'cargaison']);
  assert.equal(p.navire, null);
  assert.equal(acquerirNavire(avec, NAVIRE), null);
  for (const equipage of ['excellent', '', undefined, 'Moyen']) assert.equal(acquerirNavire(p, { ...NAVIRE, equipage }), null, String(equipage));
  assert.equal(acquerirNavire(p, { ...NAVIRE, nom: '  ' }), null);
  for (const max of ['-1', '1.5', 'trois']) assert.equal(acquerirNavire(p, { ...NAVIRE, cargaison_max: max }), null, max);
  assert.equal(acquerirNavire(p, { nom: 'Le Retour', equipage: 'moyen', cargaison_max: '' }).navire.cargaison_max, 0);
});

test('modifierNavire : les cinq champs changent, la cargaison et les champs inconnus restent ; sans navire ou refus → null', () => {
  const p = perso();
  assert.equal(modifierNavire(p, NAVIRE), null);
  p.navire = { nom: 'La Mouette', type: 'Brick', equipage: 'moyen', cargaison_max: 3, amarrage: 'Le port', cargaison: ['Fourrures'], pavillon: 'gris' };
  const apres = modifierNavire(p, { nom: 'Le Vif', type: '', equipage: 'bon', cargaison_max: '1', amarrage: '' });
  assert.deepEqual(apres.navire, { nom: 'Le Vif', type: '', equipage: 'bon', cargaison_max: 1, amarrage: '', cargaison: ['Fourrures'], pavillon: 'gris' });
  assert.equal(modifierNavire(p, { ...NAVIRE, equipage: 'x' }), null);
  assert.equal(p.navire.nom, 'La Mouette');
});

test('retirerNavire : navire = null ; sans navire → null', () => {
  const avec = acquerirNavire(perso(), NAVIRE);
  assert.equal(retirerNavire(avec).navire, null);
  assert.notEqual(avec.navire, null);
  assert.equal(retirerNavire(perso()), null);
});

test('ajouterCargaison : à la fin, doublons permis ; refusée à cargaison_max, texte vide ou sans navire', () => {
  assert.equal(ajouterCargaison(perso(), 'Épices'), null);
  let p = acquerirNavire(perso(), NAVIRE);
  p = ajouterCargaison(ajouterCargaison(p, ' Fourrures '), 'Fourrures');
  assert.deepEqual(p.navire.cargaison, ['Fourrures', 'Fourrures']);
  assert.equal(ajouterCargaison(p, ''), null);
  const plein = ajouterCargaison(p, 'Épices');
  assert.deepEqual(plein.navire.cargaison, ['Fourrures', 'Fourrures', 'Épices']);
  assert.equal(ajouterCargaison(plein, 'Soie'), null);
  // Une cargaison maximale abaissée sous le nombre d'unités ne retire rien.
  const abaisse = modifierNavire(plein, { ...NAVIRE, cargaison_max: '1' });
  assert.equal(abaisse.navire.cargaison.length, 3);
  assert.equal(ajouterCargaison(abaisse, 'Soie'), null);
});

test('retirerCargaison : retire le rang ; sans navire ou rang hors de la liste → null', () => {
  const p = ajouterCargaison(ajouterCargaison(acquerirNavire(perso(), NAVIRE), 'Fourrures'), 'Épices');
  assert.deepEqual(retirerCargaison(p, 0).navire.cargaison, ['Épices']);
  assert.deepEqual(p.navire.cargaison, ['Fourrures', 'Épices']);
  for (const rang of [-1, 2]) assert.equal(retirerCargaison(p, rang), null, String(rang));
  assert.equal(retirerCargaison(perso(), 0), null);
});

test('retirerDeListe sert aussi pour les possessions stockées, les investissements et les dépôts', () => {
  let p = ajouterLieu(ajouterLieu(perso(), 'stockees', { lieu: 'Port' }), 'stockees', { lieu: 'Grotte' });
  p = ajouterLieu(ajouterLieu(p, 'investissements', { lieu: 'Guilde' }), 'depots', { lieu: 'Banque' });
  assert.deepEqual(retirerDeListe(p, 'stockees', 0).stockees.map((e) => e.lieu), ['Grotte']);
  assert.deepEqual(retirerDeListe(p, 'investissements', 0).investissements, []);
  assert.deepEqual(retirerDeListe(p, 'depots', 0).depots, []);
  assert.equal(retirerDeListe(p, 'depots', 1), null);
});
