// Lot banc-v1 — tests de la logique pure de la mini-application d'essai.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compter, nomDuPremier } from '../js/personnages.js';

test('compter donne le nombre de personnages', () => {
  assert.equal(compter({ personnages: [] }), 0);
  assert.equal(compter({ personnages: [{ nom: 'A' }, { nom: 'B' }] }), 2);
});

test('nomDuPremier rend le nom, ou une chaîne vide', () => {
  assert.equal(nomDuPremier({ personnages: [{ nom: 'Essai' }] }), 'Essai');
  assert.equal(nomDuPremier({ personnages: [] }), '');
});
