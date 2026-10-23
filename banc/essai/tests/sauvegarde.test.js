// Lot banc-v1 — tests de la lecture d'une sauvegarde de la mini-application d'essai.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA, lire } from '../js/sauvegarde.js';

test('lire rend les données au schéma courant', () => {
  const donnees = lire({ schema: SCHEMA, personnages: [{ nom: 'Essai' }] });
  assert.deepEqual(donnees, { schema: SCHEMA, personnages: [{ nom: 'Essai' }] });
});

test('lire refuse un schéma inconnu', () => {
  assert.throws(() => lire({ schema: 99, personnages: [] }));
});

test('lire refuse ce qui n\'est pas un objet', () => {
  assert.throws(() => lire(null));
  assert.throws(() => lire([]));
});
