// Lot v0.1 — tests de la sauvegarde : lire(), l'export, le personnage neuf.
// Lot v0.3 — le schéma 2 : les tests du schéma 1 adaptés, la migration, la complétion de chaque champ neuf.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA, completerPersonnage, construireExport, lire, nomFichierExport, personnageNeuf } from '../js/sauvegarde.js';

// Lot v0.3 — la feuille aux valeurs neutres du schéma 2 (ce que reçoit un personnage du schéma 1).
const FEUILLE_NEUTRE = {
  endurance: { max: 0, actuelle: 0 },
  competences: {
    charisme: { initiale: 0, actuelle: 0, bonus: [] },
    combat: { initiale: 0, actuelle: 0, bonus: [] },
    magie: { initiale: 0, actuelle: 0, bonus: [] },
    piete: { initiale: 0, actuelle: 0, bonus: [] },
    exploration: { initiale: 0, actuelle: 0, bonus: [] },
    adresse: { initiale: 0, actuelle: 0, bonus: [] },
  },
  defense: { bonus: [] },
  bourse: 0,
  possessions: [],
  titres: [],
  benedictions: [],
  maledictions: [],
  resurrections: [],
  histoire: '',
  pretire: null,
};

// Un personnage complet du schéma 2.
const feuilleComplete = () => ({
  endurance: { max: 9, actuelle: 6 },
  competences: {
    charisme: { initiale: 2, actuelle: 2, bonus: [{ valeur: -1, raison: 'Cicatrice' }] },
    combat: { initiale: 5, actuelle: 6, bonus: [{ valeur: 1, raison: 'Lance' }] },
    magie: { initiale: 2, actuelle: 2, bonus: [] },
    piete: { initiale: 3, actuelle: 3, bonus: [] },
    exploration: { initiale: 6, actuelle: 6, bonus: [] },
    adresse: { initiale: 4, actuelle: 4, bonus: [] },
  },
  defense: { bonus: [{ valeur: 1, raison: 'Gilet en cuir' }] },
  bourse: 41,
  possessions: ['Lance', 'Gilet en cuir'],
  titres: ['Ami des Rangers'],
  benedictions: [{ origine: 'Alvir', consequences: 'Relance' }],
  maledictions: [{ origine: '', consequences: 'Fièvre' }],
  resurrections: [{ origine: 'Nagil', lieu: 'Marlock', livre: 1, section: null }],
  histoire: 'Partie de Sokar.',
  pretire: 'liana',
});

const complet = () => ({
  format: 'fabled-lands-helper',
  schema: 2,
  exporte_le: '2026-10-23T14:00:00.000Z',
  personnages: [{
    id: 'a',
    nom: 'Aldwen',
    profession: 'Mage',
    niveau: 2,
    section_en_cours: { livre: 1, section: 183 },
    cree_le: '2026-10-23T13:05:00.000Z',
    modifie_le: '2026-10-23T13:30:00.000Z',
    ...feuilleComplete(),
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
    ...FEUILLE_NEUTRE,
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

test('construireExport écrit le fichier du schéma 2, et lire le relit', () => {
  const personnages = lire(complet()).personnages;
  const fichier = construireExport(personnages, new Date('2026-10-24T08:00:00.000Z'));
  assert.deepEqual(Object.keys(fichier), ['format', 'schema', 'exporte_le', 'personnages']);
  assert.equal(fichier.format, 'fabled-lands-helper');
  assert.equal(fichier.schema, 2);
  assert.equal(fichier.exporte_le, '2026-10-24T08:00:00.000Z');
  assert.deepEqual(lire(JSON.parse(JSON.stringify(fichier))).personnages, personnages);
});

test('nomFichierExport porte la date locale du jour', () => {
  assert.equal(nomFichierExport(new Date(2026, 9, 3, 12, 0, 0)), 'fabled-lands-helper-2026-10-03.flh.json');
});

test('personnageNeuf : niveau 1, livre 1 section 1, identifiant et dates posés, feuille neutre du schéma 2', () => {
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
    ...FEUILLE_NEUTRE,
  });
  assert.deepEqual(lire(construireExport([neuf])).personnages[0], neuf);
  assert.match(personnageNeuf('Eve', '').id, /^[0-9a-f-]{36}$/);
  assert.doesNotThrow(() => lire(construireExport([neuf])));
});

// ---- Lot v0.3 — le schéma 2 ---------------------------------------------------------------------------------

// Le personnage relu après qu'un champ a reçu `valeur` (undefined : le champ est retiré).
function relu(champ, valeur) {
  const fichier = complet();
  if (valeur === undefined) delete fichier.personnages[0][champ];
  else fichier.personnages[0][champ] = valeur;
  return lire(fichier).personnages[0];
}

test('SCHEMA vaut 2', () => {
  assert.equal(SCHEMA, 2);
});

test('la migration d\'un personnage du schéma 1 : tout gardé, la feuille aux valeurs neutres', () => {
  const ancien = {
    id: 'b', nom: 'Brunehaut', profession: 'Guerrière', niveau: 2,
    section_en_cours: { livre: 1, section: 1 }, cree_le: '2026-10-23T13:00:00.000Z', modifie_le: '2026-10-23T13:10:00.000Z',
  };
  const donnees = lire({ format: 'fabled-lands-helper', schema: 1, exporte_le: '2026-10-23T14:00:00.000Z', personnages: [ancien] });
  assert.equal(donnees.schema, 2);
  assert.deepEqual(donnees.personnages[0], { ...ancien, ...FEUILLE_NEUTRE });
});

test('un personnage complet du schéma 2 est relu sans changer', () => {
  const fichier = complet();
  assert.deepEqual(lire(fichier).personnages, fichier.personnages);
  assert.deepEqual(lire(JSON.parse(JSON.stringify(fichier))).personnages, fichier.personnages);
});

test('endurance invalide : max 0 s\'il n\'est pas un entier ≥ 0 ; actuelle ramenée dans [0, max], 0 si non entière', () => {
  assert.deepEqual(relu('endurance', undefined).endurance, { max: 0, actuelle: 0 });
  assert.deepEqual(relu('endurance', 'neuf').endurance, { max: 0, actuelle: 0 });
  assert.deepEqual(relu('endurance', { max: -2, actuelle: 3 }).endurance, { max: 0, actuelle: 0 });
  assert.deepEqual(relu('endurance', { max: 9.5, actuelle: 3 }).endurance, { max: 0, actuelle: 0 });
  assert.deepEqual(relu('endurance', { max: 9, actuelle: 12 }).endurance, { max: 9, actuelle: 9 });
  assert.deepEqual(relu('endurance', { max: 9, actuelle: -1 }).endurance, { max: 9, actuelle: 0 });
  assert.deepEqual(relu('endurance', { max: 9, actuelle: '6' }).endurance, { max: 9, actuelle: 0 });
});

test('competences invalides : chaque clé absente ou invalide est neutre ; initiale, actuelle 0 si non entières ≥ 0', () => {
  assert.deepEqual(relu('competences', undefined).competences, FEUILLE_NEUTRE.competences);
  assert.deepEqual(relu('competences', []).competences, FEUILLE_NEUTRE.competences);
  const lu = relu('competences', {
    charisme: 'deux',
    combat: { initiale: -1, actuelle: 2.5, bonus: [{ valeur: 1, raison: 'Épée' }] },
    magie: { initiale: 3, actuelle: 4 },
  }).competences;
  assert.deepEqual(lu.charisme, { initiale: 0, actuelle: 0, bonus: [] });
  assert.deepEqual(lu.combat, { initiale: 0, actuelle: 0, bonus: [{ valeur: 1, raison: 'Épée' }] });
  assert.deepEqual(lu.magie, { initiale: 3, actuelle: 4, bonus: [] });
  assert.deepEqual(lu.adresse, { initiale: 0, actuelle: 0, bonus: [] });
});

test('competences : une clé inconnue est conservée', () => {
  const lu = relu('competences', { ...feuilleComplete().competences, chance: { initiale: 1 } }).competences;
  assert.deepEqual(lu.chance, { initiale: 1 });
  assert.deepEqual(lu.combat, feuilleComplete().competences.combat);
});

test('bonus invalides (d\'une compétence et de la Défense) : [] si pas un tableau ; une entrée invalide est retirée', () => {
  const competences = feuilleComplete().competences;
  competences.combat.bonus = 'beaucoup';
  competences.magie.bonus = [
    { valeur: 2, raison: 'Bâton' }, { valeur: 0, raison: 'Nul' }, { valeur: 1.5, raison: 'Demi' },
    { valeur: 1, raison: '' }, { valeur: 1 }, null, 'texte', { valeur: -1, raison: 'Fatigue' },
  ];
  const lu = relu('competences', competences).competences;
  assert.deepEqual(lu.combat.bonus, []);
  assert.deepEqual(lu.magie.bonus, [{ valeur: 2, raison: 'Bâton' }, { valeur: -1, raison: 'Fatigue' }]);
  assert.deepEqual(relu('defense', { bonus: 'non' }).defense, { bonus: [] });
  assert.deepEqual(relu('defense', { bonus: [{ valeur: 3, raison: 'Cotte' }, { valeur: '1', raison: 'Texte' }] }).defense,
    { bonus: [{ valeur: 3, raison: 'Cotte' }] });
});

test('defense invalide : { bonus: [] }', () => {
  assert.deepEqual(relu('defense', undefined).defense, { bonus: [] });
  assert.deepEqual(relu('defense', 7).defense, { bonus: [] });
  assert.deepEqual(relu('defense', [1]).defense, { bonus: [] });
});

test('bourse invalide : 0', () => {
  for (const valeur of [undefined, -1, 2.5, '41', null]) assert.equal(relu('bourse', valeur).bourse, 0, String(valeur));
  assert.equal(relu('bourse', 0).bourse, 0);
});

test('possessions invalides : [] ; une entrée invalide est retirée', () => {
  assert.deepEqual(relu('possessions', undefined).possessions, []);
  assert.deepEqual(relu('possessions', 'Corde').possessions, []);
  assert.deepEqual(relu('possessions', ['Corde', '', 3, null, 'Corde']).possessions, ['Corde', 'Corde']);
});

test('possessions : plus de 12 entrées sont conservées', () => {
  const quinze = Array.from({ length: 15 }, (_, i) => `Objet ${i + 1}`);
  assert.deepEqual(relu('possessions', quinze).possessions, quinze);
});

test('titres invalides : [] ; une entrée invalide est retirée', () => {
  assert.deepEqual(relu('titres', undefined).titres, []);
  assert.deepEqual(relu('titres', { a: 1 }).titres, []);
  assert.deepEqual(relu('titres', ['Chevalier', '', 4]).titres, ['Chevalier']);
});

test('benedictions, maledictions invalides : [] ; une entrée non objet est retirée ; un champ non chaîne devient ""', () => {
  for (const champ of ['benedictions', 'maledictions']) {
    assert.deepEqual(relu(champ, undefined)[champ], [], champ);
    assert.deepEqual(relu(champ, 'Alvir')[champ], [], champ);
    assert.deepEqual(relu(champ, [{ origine: 'Alvir', consequences: 3 }, 'texte', null, [], { origine: null }])[champ],
      [{ origine: 'Alvir', consequences: '' }, { origine: '', consequences: '' }], champ);
  }
});

test('resurrections invalides : [] ; entrée non objet retirée ; origine, lieu "" ; livre, section null si non entiers', () => {
  assert.deepEqual(relu('resurrections', undefined).resurrections, []);
  assert.deepEqual(relu('resurrections', 5).resurrections, []);
  assert.deepEqual(relu('resurrections', [{ origine: 4, lieu: 'Marlock', livre: '1', section: 100 }, 'x', { livre: 2.5 }]).resurrections, [
    { origine: '', lieu: 'Marlock', livre: null, section: 100 },
    { origine: '', lieu: '', livre: null, section: null },
  ]);
});

test('histoire invalide : ""', () => {
  assert.equal(relu('histoire', undefined).histoire, '');
  assert.equal(relu('histoire', 12).histoire, '');
});

test('pretire invalide : null', () => {
  for (const valeur of [undefined, '', 3, {}]) assert.equal(relu('pretire', valeur).pretire, null, String(valeur));
  assert.equal(relu('pretire', 'tjell').pretire, 'tjell');
});

test('un champ inconnu est conservé à côté des champs neufs, au personnage comme dans une entrée', () => {
  const fichier = complet();
  fichier.personnages[0].codes = ['A'];
  fichier.personnages[0].endurance.note = 'blessé';
  fichier.personnages[0].benedictions[0].duree = 3;
  const lu = lire(fichier).personnages[0];
  assert.deepEqual(lu.codes, ['A']);
  assert.equal(lu.endurance.note, 'blessé');
  assert.equal(lu.benedictions[0].duree, 3);
  assert.deepEqual(lu.possessions, ['Lance', 'Gilet en cuir']);
  assert.equal(lu.bourse, 41);
});

test('schema: 3 lève SCHEMA_RECENT', () => {
  assert.throws(() => lire({ ...complet(), schema: 3 }), (erreur) => erreur.code === 'SCHEMA_RECENT');
});

test('completerPersonnage (le stockage) : même complétion, refuse sans id ou sans nom, ne partage rien', () => {
  const ancien = { id: 'b', nom: 'Brunehaut', niveau: 2 };
  const lu = completerPersonnage(ancien);
  assert.deepEqual(lu.endurance, { max: 0, actuelle: 0 });
  assert.equal(lu.cree_le, '1970-01-01T00:00:00.000Z');
  lu.possessions.push('Corde');
  assert.deepEqual(ancien, { id: 'b', nom: 'Brunehaut', niveau: 2 });
  assert.throws(() => completerPersonnage({ nom: 'Sans id' }));
  assert.throws(() => completerPersonnage({ id: 'x' }));
});
