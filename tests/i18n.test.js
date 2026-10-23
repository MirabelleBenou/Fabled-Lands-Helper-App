// Lot v0.1 — tests des dictionnaires : t(), le choix de la langue, FR et EN aux mêmes clés.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { choisirLangue, installerDictionnaire, t } from '../js/i18n.js';

const dictionnaire = (langue) => JSON.parse(readFileSync(new URL(`../i18n/${langue}.json`, import.meta.url), 'utf8'));

test('t rend le texte d\'une clé simple', () => {
  installerDictionnaire({ 'accueil.titre': 'Mes personnages' });
  assert.equal(t('accueil.titre'), 'Mes personnages');
});

test('t remplace {n}, partout où il apparaît', () => {
  installerDictionnaire({ 'reglages.importe': 'Personnages importés : {n}', 'double': '{n} sur {n}' });
  assert.equal(t('reglages.importe', { n: 3 }), 'Personnages importés : 3');
  assert.equal(t('reglages.importe', { n: 0 }), 'Personnages importés : 0');
  assert.equal(t('double', { n: 2 }), '2 sur 2');
});

test('t rend la clé elle-même quand elle est inconnue, et laisse {n} sans valeur', () => {
  installerDictionnaire({ 'a': 'texte {n}' });
  assert.equal(t('absente'), 'absente');
  assert.equal(t('a'), 'texte {n}');
});

test('choisirLangue : français si l\'appareil commence par fr, sinon anglais', () => {
  assert.equal(choisirLangue('fr'), 'fr');
  assert.equal(choisirLangue('fr-CA'), 'fr');
  assert.equal(choisirLangue('FR-fr'), 'fr');
  assert.equal(choisirLangue('en-US'), 'en');
  assert.equal(choisirLangue('de'), 'en');
  assert.equal(choisirLangue(undefined), 'en');
});

test('les dictionnaires FR et EN ont les mêmes clés et les mêmes marqueurs', () => {
  const fr = dictionnaire('fr');
  const en = dictionnaire('en');
  assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
  const marqueurs = (texte) => (texte.match(/\{\w+\}/g) ?? []).sort();
  for (const cle of Object.keys(fr)) {
    assert.ok(fr[cle] !== '' && en[cle] !== '', `${cle} vide`);
    assert.deepEqual(marqueurs(fr[cle]), marqueurs(en[cle]), `${cle} : marqueurs différents`);
  }
});

test('le dictionnaire français rend le texte attendu pour une clé à marqueur', () => {
  installerDictionnaire(dictionnaire('fr'));
  assert.equal(t('reglages.importe', { n: 2 }), 'Personnages importés : 2');
  installerDictionnaire(dictionnaire('en'));
  assert.equal(t('reglages.importe', { n: 2 }), 'Characters imported: 2');
});
