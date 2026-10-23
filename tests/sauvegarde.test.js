// Lot v0.1 — tests de la sauvegarde : lire(), l'export, le personnage neuf.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA, construireExport, lire, nomFichierExport, personnageNeuf } from '../js/sauvegarde.js';

const complet = () => ({
  format: 'fabled-lands-helper',
  schema: 1,
  exporte_le: '2026-10-23T14:00:00.000Z',
  personnages: [{
    id: 'a',
    nom: 'Aldwen',
    profession: 'Mage',
    niveau: 2,
    section_en_cours: { livre: 1, section: 183 },
    cree_le: '2026-10-23T13:05:00.000Z',
    modifie_le: '2026-10-23T13:30:00.000Z',
  }],
});

test('lire rend un fichier valide au schéma courant, sans rien changer', () => {
  const fichier = complet();
  const donnees = lire(fichier);
  assert.equal(donnees.schema, SCHEMA);
  assert.deepEqual(donnees.personnages, fichier.personnages);
});

test('lire refuse un mauvais format', () => {
  assert.throws(() => lire({ ...complet(), format: 'autre-chose' }));
  const sansFormat = complet();
  delete sansFormat.format;
  assert.throws(() => lire(sansFormat));
});

test('lire refuse ce qui n\'est pas un objet', () => {
  for (const valeur of [null, undefined, 'texte', 3, []]) assert.throws(() => lire(valeur));
});

test('lire refuse un numéro de schéma illisible', () => {
  for (const schema of [0, -1, 1.5, '1', null]) assert.throws(() => lire({ ...complet(), schema }));
});

test('lire lève SCHEMA_RECENT pour un schéma supérieur au courant', () => {
  assert.throws(() => lire({ ...complet(), schema: SCHEMA + 1 }), (erreur) => erreur.code === 'SCHEMA_RECENT');
});

test('lire refuse des personnages qui ne sont pas un tableau', () => {
  assert.throws(() => lire({ ...complet(), personnages: {} }));
  const sans = complet();
  delete sans.personnages;
  assert.throws(() => lire(sans));
});

test('lire refuse un personnage sans nom, ou sans id', () => {
  for (const manque of ['nom', 'id']) {
    const fichier = complet();
    delete fichier.personnages[0][manque];
    assert.throws(() => lire(fichier));
    fichier.personnages[0][manque] = '';
    assert.throws(() => lire(fichier));
    fichier.personnages[0][manque] = 42;
    assert.throws(() => lire(fichier));
  }
  assert.throws(() => lire({ ...complet(), personnages: [null] }));
});

test('lire complète les valeurs par défaut manquantes', () => {
  const donnees = lire({
    format: 'fabled-lands-helper',
    schema: 1,
    exporte_le: '2026-10-23T14:00:00.000Z',
    personnages: [{ id: 'b', nom: 'Brunehaut' }],
  });
  assert.deepEqual(donnees.personnages[0], {
    id: 'b',
    nom: 'Brunehaut',
    profession: '',
    niveau: 1,
    section_en_cours: { livre: 1, section: 1 },
    cree_le: '2026-10-23T14:00:00.000Z',
    modifie_le: '2026-10-23T14:00:00.000Z',
  });
});

test('lire date de l\'époque zéro un personnage sans date ni exporte_le', () => {
  const donnees = lire({ format: 'fabled-lands-helper', schema: 1, personnages: [{ id: 'c', nom: 'Corin' }] });
  assert.equal(donnees.personnages[0].cree_le, '1970-01-01T00:00:00.000Z');
  assert.equal(donnees.personnages[0].modifie_le, '1970-01-01T00:00:00.000Z');
});

test('lire garde une section nulle et refuse une section mal formée', () => {
  const fichier = complet();
  fichier.personnages[0].section_en_cours = { livre: 1, section: null };
  assert.deepEqual(lire(fichier).personnages[0].section_en_cours, { livre: 1, section: null });
  fichier.personnages[0].section_en_cours = { livre: 'un' };
  assert.deepEqual(lire(fichier).personnages[0].section_en_cours, { livre: 1, section: 1 });
});

test('lire conserve les champs inconnus, au niveau du personnage comme plus bas', () => {
  const fichier = complet();
  fichier.personnages[0].or = 12;
  fichier.personnages[0].sac = { objets: ['corde'] };
  fichier.personnages[0].section_en_cours.page = 4;
  const lu = lire(fichier).personnages[0];
  assert.equal(lu.or, 12);
  assert.deepEqual(lu.sac, { objets: ['corde'] });
  assert.equal(lu.section_en_cours.page, 4);
  // …et la copie ne partage rien avec le fichier d'origine.
  lu.sac.objets.push('lampe');
  assert.deepEqual(fichier.personnages[0].sac, { objets: ['corde'] });
});

test('construireExport écrit le fichier du schéma 1, et lire le relit', () => {
  const personnages = lire(complet()).personnages;
  const fichier = construireExport(personnages, new Date('2026-10-24T08:00:00.000Z'));
  assert.deepEqual(Object.keys(fichier), ['format', 'schema', 'exporte_le', 'personnages']);
  assert.equal(fichier.format, 'fabled-lands-helper');
  assert.equal(fichier.schema, 1);
  assert.equal(fichier.exporte_le, '2026-10-24T08:00:00.000Z');
  assert.deepEqual(lire(JSON.parse(JSON.stringify(fichier))).personnages, personnages);
});

test('nomFichierExport porte la date locale du jour', () => {
  assert.equal(nomFichierExport(new Date(2026, 9, 3, 12, 0, 0)), 'fabled-lands-helper-2026-10-03.flh.json');
});

test('personnageNeuf : niveau 1, livre 1 section 1, identifiant et dates posés', () => {
  const maintenant = new Date('2026-10-23T15:00:00.000Z');
  const neuf = personnageNeuf('Dalia', 'Voleuse', maintenant, 'id-fixe');
  assert.deepEqual(neuf, {
    id: 'id-fixe',
    nom: 'Dalia',
    profession: 'Voleuse',
    niveau: 1,
    section_en_cours: { livre: 1, section: 1 },
    cree_le: '2026-10-23T15:00:00.000Z',
    modifie_le: '2026-10-23T15:00:00.000Z',
  });
  assert.match(personnageNeuf('Eve', '').id, /^[0-9a-f-]{36}$/);
  assert.doesNotThrow(() => lire(construireExport([neuf])));
});
