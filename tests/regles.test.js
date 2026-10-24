// Lot v0.3 — tests des règles de calcul de la feuille d'aventure et de leurs bornes (js/regles.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPETENCES,
  MAX_POSSESSIONS,
  ajouterBonus,
  ajouterEntree,
  ajouterPossession,
  ajouterTitre,
  changerBase,
  changerBourse,
  changerEndurance,
  changerEnduranceMax,
  changerNiveau,
  defense,
  entierSaisi,
  feuilleLibre,
  operationBourse,
  retirerBonus,
  retirerDeListe,
  signe,
  totalCompetence,
} from '../js/regles.js';
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
  assert.deepEqual(p.possessions, ['Corde', 'Corde']);
  assert.equal(ajouterPossession(perso(), '   '), null);
});

test('Possessions : à 12, plus rien ne s\'ajoute ; en retirer une libère une place', () => {
  let p = perso();
  for (let i = 1; i <= 12; i += 1) p = ajouterPossession(p, `Objet ${i}`);
  assert.equal(p.possessions.length, 12);
  assert.equal(ajouterPossession(p, 'De trop'), null);
  const moins = retirerDeListe(p, 'possessions', 0);
  assert.equal(moins.possessions[0], 'Objet 2');
  assert.equal(ajouterPossession(moins, 'Nouveau').possessions[11], 'Nouveau');
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
