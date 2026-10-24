// Lot v0.3 — tests des pré-tirés (js/pretires.js) et des liens déclarés (js/liens.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRETIRES, personnagePretire, pretireParId } from '../js/pretires.js';
import { COMPETENCES, defense, totalCompetence } from '../js/regles.js';
import { construireExport, lire } from '../js/sauvegarde.js';
import { LIENS } from '../js/liens.js';

const MAINTENANT = new Date('2026-10-24T10:00:00.000Z');
const fabrique = (p) => personnagePretire(p, p.nom, MAINTENANT, `id-${p.id}`);

// Le tableau du cadrage (§2-9) : id, niveau, six compétences, possessions, exclusif, Défense publiée.
const TABLEAU = [
  ['liana', 'Liana la Vive', 'Voyageuse', 1, [2, 5, 2, 3, 6, 4], ['Lance', 'Gilet en cuir'], false, 7],
  ['andriel', 'Andriel le Marteau', 'Guerrier', 1, [3, 6, 2, 4, 3, 2], ['Hache de guerre', 'Gilet en cuir'], false, 8],
  ['chalor', 'Chalor l\'Exilé', 'Mage', 1, [2, 2, 6, 1, 5, 3], ['Bâton', 'Gilet en cuir'], false, 4],
  ['marana', 'Marana Cœur de Feu', 'Voleuse', 1, [5, 4, 4, 1, 2, 6], ['Épée', 'Gilet en cuir'], false, 6],
  ['ignace', 'Ignace le Dévot', 'Prêtre', 1, [4, 2, 3, 6, 4, 2], ['Gourdin', 'Gilet en cuir'], false, 4],
  ['astariel', 'Astariel Chanteciel', 'Troubadour', 1, [6, 3, 4, 3, 2, 4], ['Épée', 'Gilet en cuir'], false, 5],
  ['rordon', 'Rordon Boisvert', 'Prêtre', 1, [4, 2, 3, 6, 4, 2], ['Gourdin', 'Gilet en cuir'], true, 4],
  ['madrigua', 'Madrigua aux mille histoires', 'Voyageuse', 1, [2, 5, 2, 3, 6, 4], ['Dague', 'Gilet en cuir'], true, 7],
  ['tjell', 'Tjell Lao-Me', 'Troubadour / Danseuse', 2, [6, 4, 4, 1, 2, 5], ['Bâton de combat', 'Boussole', 'Gilet en cuir'], true, 6],
];

test('9 pré-tirés, identifiants uniques, dans l\'ordre du tableau', () => {
  assert.equal(PRETIRES.length, 9);
  assert.equal(new Set(PRETIRES.map((p) => p.id)).size, 9);
  assert.deepEqual(PRETIRES.map((p) => p.id), TABLEAU.map((l) => l[0]));
});

test('chaque pré-tiré : nom, profession, niveau, compétences, possessions et exclusivité du tableau', () => {
  for (const [id, nom, profession, niveau, valeurs, possessions, exclusif] of TABLEAU) {
    const p = pretireParId(id);
    assert.deepEqual([p.nom, p.profession, p.niveau, p.exclusif], [nom, profession, niveau, exclusif], id);
    assert.deepEqual(COMPETENCES.map((code) => p.competences[code]), valeurs, id);
    assert.deepEqual(p.possessions, possessions, id);
  }
  assert.equal(pretireParId('inconnu'), null);
});

test('pour chaque pré-tiré, defense() du personnage fabriqué égale la Défense publiée', () => {
  for (const [id, , , , , , , publiee] of TABLEAU) assert.equal(defense(fabrique(pretireParId(id))), publiee, id);
});

test('le personnage fabriqué : Endurance 9 / 9, Bourse 16, initiale = actuelle = valeur, pretire = id', () => {
  for (const pretire of PRETIRES) {
    const p = fabrique(pretire);
    assert.deepEqual(p.endurance, { max: 9, actuelle: 9 });
    assert.equal(p.bourse, 16);
    assert.equal(p.pretire, pretire.id);
    assert.equal(p.nom, pretire.nom);
    assert.equal(p.niveau, pretire.niveau);
    assert.deepEqual(p.possessions, pretire.possessions);
    for (const code of COMPETENCES) {
      assert.equal(p.competences[code].initiale, pretire.competences[code]);
      assert.equal(p.competences[code].actuelle, pretire.competences[code]);
    }
  }
});

test('les bonus : Défense +1 Gilet en cuir pour chacun ; Tjell : Exploration +1 Boussole, Défense −1 Fiche de l\'éditeur', () => {
  for (const pretire of PRETIRES.filter((p) => p.id !== 'tjell')) {
    const p = fabrique(pretire);
    assert.deepEqual(p.defense.bonus, [{ valeur: 1, raison: 'Gilet en cuir' }]);
    for (const code of COMPETENCES) assert.deepEqual(p.competences[code].bonus, []);
  }
  const tjell = fabrique(pretireParId('tjell'));
  assert.deepEqual(tjell.defense.bonus, [{ valeur: 1, raison: 'Gilet en cuir' }, { valeur: -1, raison: 'Fiche de l\'éditeur' }]);
  assert.deepEqual(tjell.competences.exploration.bonus, [{ valeur: 1, raison: 'Boussole' }]);
  assert.equal(totalCompetence(tjell, 'exploration'), 3);
});

test('le nom choisi remplace celui du pré-tiré ; deux personnages ne partagent rien', () => {
  const a = personnagePretire(pretireParId('liana'), 'Ma Liana', MAINTENANT, 'a');
  const b = personnagePretire(pretireParId('liana'), 'Autre', MAINTENANT, 'b');
  assert.equal(a.nom, 'Ma Liana');
  a.possessions.push('Corde');
  a.defense.bonus.push({ valeur: 2, raison: 'Bouclier' });
  assert.deepEqual(b.possessions, ['Lance', 'Gilet en cuir']);
  assert.equal(b.defense.bonus.length, 1);
  assert.deepEqual(pretireParId('liana').possessions, ['Lance', 'Gilet en cuir']);
});

test('le personnage fabriqué passe lire(construireExport([…])) sans changer', () => {
  const personnages = PRETIRES.map(fabrique);
  const relu = lire(JSON.parse(JSON.stringify(construireExport(personnages, MAINTENANT)))).personnages;
  assert.deepEqual(relu, personnages);
});

test('LIENS.pretires est l\'adresse des fiches de l\'éditeur, seule entrée', () => {
  assert.deepEqual(Object.keys(LIENS), ['pretires']);
  assert.equal(LIENS.pretires, 'https://alkonost-editions.com/collections/livres-jeux/fabled-lands/personnages-pretires/livres-1-2/');
});
