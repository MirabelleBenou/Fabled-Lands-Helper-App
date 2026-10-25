// Lot v0.5 — tests des dés (js/des.js) : le tirage, le lancer, le texte d'un jet, les points des faces.
import test from 'node:test';
import assert from 'node:assert/strict';
import { lancer, points, somme, texteJet, tirageNavigateur } from '../js/des.js';

test('lancer : un dé et deux dés, le nombre de valeurs', () => {
  assert.equal(lancer(1).length, 1);
  assert.equal(lancer(2).length, 2);
  for (const valeur of [...lancer(1), ...lancer(2)]) assert.ok(Number.isInteger(valeur) && valeur >= 1 && valeur <= 6);
});

test('lancer : les valeurs d\'un tirage injecté, dans l\'ordre', () => {
  const suite = [4, 3, 6];
  let appels = 0;
  const tirage = () => suite[appels++];
  assert.deepEqual(lancer(2, tirage), [4, 3]);
  assert.equal(appels, 2);
  assert.deepEqual(lancer(1, tirage), [6]);
  assert.equal(appels, 3);
});

test('tirageNavigateur : 600 tirages, tous entiers de 1 à 6', () => {
  for (let i = 0; i < 600; i++) {
    const valeur = tirageNavigateur();
    assert.ok(Number.isInteger(valeur) && valeur >= 1 && valeur <= 6, `tirage ${valeur}`);
  }
});

test('tirageNavigateur : rejette les octets au-delà de 251 (252, 255, puis 9 rend 4, en trois appels)', (t) => {
  const octets = [252, 255, 9];
  let appel = 0;
  const faux = t.mock.method(globalThis.crypto, 'getRandomValues', (tableau) => {
    tableau[0] = octets[appel++];
    return tableau;
  });
  assert.equal(tirageNavigateur(), 4);
  assert.equal(faux.mock.callCount(), 3);
});

test('tirageNavigateur : l\'octet 0 rend 1, l\'octet 251 rend 6', (t) => {
  let octet = 0;
  t.mock.method(globalThis.crypto, 'getRandomValues', (tableau) => {
    tableau[0] = octet;
    return tableau;
  });
  assert.equal(tirageNavigateur(), 1);
  octet = 251;
  assert.equal(tirageNavigateur(), 6);
});

test('tirageNavigateur : tire un octet sur un Uint8Array d\'un élément', (t) => {
  const faux = t.mock.method(globalThis.crypto, 'getRandomValues', (tableau) => {
    tableau[0] = 7;
    return tableau;
  });
  tirageNavigateur();
  const [tableau] = faux.mock.calls[0].arguments;
  assert.ok(tableau instanceof Uint8Array);
  assert.equal(tableau.length, 1);
});

test('somme', () => {
  assert.equal(somme([5]), 5);
  assert.equal(somme([4, 3]), 7);
  assert.equal(somme([6, 6]), 12);
});

test('texteJet : un dé la valeur seule, deux dés « a + b = somme »', () => {
  assert.equal(texteJet([5]), '5');
  assert.equal(texteJet([4, 3]), '4 + 3 = 7');
  assert.equal(texteJet([6, 5]), '6 + 5 = 11');
});

test('points : autant de cases que la valeur, de 0 à 8, sans doublon', () => {
  for (let valeur = 1; valeur <= 6; valeur++) {
    const cases = points(valeur);
    assert.equal(cases.length, valeur);
    assert.equal(new Set(cases).size, valeur);
    for (const c of cases) assert.ok(Number.isInteger(c) && c >= 0 && c <= 8);
  }
});

test('points : la table des faces', () => {
  assert.deepEqual(points(1), [4]);
  assert.deepEqual(points(2), [2, 6]);
  assert.deepEqual(points(3), [2, 4, 6]);
  assert.deepEqual(points(4), [0, 2, 6, 8]);
  assert.deepEqual(points(5), [0, 2, 4, 6, 8]);
  assert.deepEqual(points(6), [0, 2, 3, 5, 6, 8]);
});
