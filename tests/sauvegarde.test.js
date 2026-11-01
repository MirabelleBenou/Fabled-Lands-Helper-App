// Lot v0.1 — tests de la sauvegarde : lire(), l'export, le personnage neuf.
// Lot v0.3 — le schéma 2 : les tests du schéma 1 adaptés, la migration, la complétion de chaque champ neuf.
// Lot v0.4 — le schéma 3 : les tests du schéma 2 mis au schéma 3 (possessions en objets), la complétion des objets
// et le rattachement des bonus à la main.
// Lot v0.6 — le schéma 4 : les tests du schéma 3 mis au schéma 4 (le journal), la complétion des quatre listes.
// Lot v0.7 — le schéma 5 : les tests du schéma 4 comme schéma courant mis au schéma 5 (les codes et les cases de
// section), la complétion des trois listes neuves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA, completerPersonnage, construireExport, lire, nomFichierExport, personnageNeuf } from '../js/sauvegarde.js';
import { defense } from '../js/regles.js';

// Lot v0.6 — le journal vide (ce que reçoit un personnage des schémas 1, 2 et 3).
const JOURNAL_VIDE = { historique: [], quetes: [], notes: [], combats: [] };

// Lot v0.7 — les codes et les cases vides (ce que reçoit un personnage des schémas 1 à 4).
const LISTES_VIDES = { codes: [], cases: [] };

// Lot v0.3 — la feuille aux valeurs neutres du schéma 2 (ce que reçoit un personnage du schéma 1) ; lot v0.6 : et le
// journal vide ; lot v0.7 : et les codes et les cases vides.
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
  ...JOURNAL_VIDE,
  ...LISTES_VIDES,
};

// Un personnage complet du schéma 5 (lot v0.4 : les bonus de la Lance et du Gilet sont sur les objets ; lot v0.6 : le
// journal ; lot v0.7 : les codes, les cases de section et les codes liés d'une quête).
const feuilleComplete = () => ({
  endurance: { max: 9, actuelle: 6 },
  competences: {
    charisme: { initiale: 2, actuelle: 2, bonus: [{ valeur: -1, raison: 'Cicatrice' }] },
    combat: { initiale: 5, actuelle: 6, bonus: [] },
    magie: { initiale: 2, actuelle: 2, bonus: [] },
    piete: { initiale: 3, actuelle: 3, bonus: [] },
    exploration: { initiale: 6, actuelle: 6, bonus: [] },
    adresse: { initiale: 4, actuelle: 4, bonus: [] },
  },
  defense: { bonus: [] },
  bourse: 41,
  possessions: [{ texte: 'Lance', bonus: { cible: 'combat', valeur: 1 } }, { texte: 'Gilet en cuir', bonus: { cible: 'defense', valeur: 1 } }],
  titres: ['Ami des Rangers'],
  benedictions: [{ origine: 'Alvir', consequences: 'Relance' }],
  maledictions: [{ origine: '', consequences: 'Fièvre' }],
  resurrections: [{ origine: 'Nagil', lieu: 'Marlock', livre: 1, section: null }],
  histoire: 'Partie de Sokar.',
  pretire: 'liana',
  historique: [{ livre: 1, section: 1 }, { livre: 1, section: 87 }],
  quetes: [{ titre: 'Retrouver Aldo', personnages: 'Aldo', sections: [{ livre: 1, section: 112 }], codes: ['Aide'], terminee: false }],
  notes: [{ texte: 'Le port.', livre: 1, section: 87, ecrite_le: '2026-10-23T13:20:00.000Z' }],
  combats: [{ nom: 'Loup', combat: 4, defense: 6, endurance: { max: 9, actuelle: 5 }, livre: 1, section: 183, termine: false }],
  codes: ['Aide', 'Azur'],
  cases: [{ livre: 1, section: 19, libelle: '', rangs: [0, 2] }, { livre: 1, section: 10, libelle: 'chez_vous', rangs: [0] }],
});

const complet = () => ({
  format: 'fabled-lands-helper',
  schema: 5,
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

test('construireExport écrit le fichier du schéma 5, et lire le relit', () => {
  const personnages = lire(complet()).personnages;
  const fichier = construireExport(personnages, new Date('2026-10-24T08:00:00.000Z'));
  assert.deepEqual(Object.keys(fichier), ['format', 'schema', 'exporte_le', 'personnages']);
  assert.equal(fichier.format, 'fabled-lands-helper');
  assert.equal(fichier.schema, 5);
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

test('SCHEMA vaut 5', () => {
  assert.equal(SCHEMA, 5);
});

test('la migration d\'un personnage du schéma 1 : tout gardé, la feuille aux valeurs neutres', () => {
  const ancien = {
    id: 'b', nom: 'Brunehaut', profession: 'Guerrière', niveau: 2,
    section_en_cours: { livre: 1, section: 1 }, cree_le: '2026-10-23T13:00:00.000Z', modifie_le: '2026-10-23T13:10:00.000Z',
  };
  const donnees = lire({ format: 'fabled-lands-helper', schema: 1, exporte_le: '2026-10-23T14:00:00.000Z', personnages: [ancien] });
  assert.equal(donnees.schema, 5);
  assert.deepEqual(donnees.personnages[0], { ...ancien, ...FEUILLE_NEUTRE });
});

test('un personnage complet du schéma 5 est relu sans changer', () => {
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
  assert.deepEqual(relu('possessions', ['Corde', '', 3, null, 'Corde']).possessions,
    [{ texte: 'Corde', bonus: null }, { texte: 'Corde', bonus: null }]);
});

test('possessions : plus de 12 entrées sont conservées', () => {
  const quinze = Array.from({ length: 15 }, (_, i) => ({ texte: `Objet ${i + 1}`, bonus: null }));
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
  assert.deepEqual(lu.possessions, feuilleComplete().possessions);
  assert.equal(lu.bourse, 41);
});

test('schema: 6 lève SCHEMA_RECENT', () => {
  assert.throws(() => lire({ ...complet(), schema: 6 }), (erreur) => erreur.code === 'SCHEMA_RECENT');
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

// ---- Lot v0.4 — le schéma 3 : la complétion des objets, le rattachement --------------------------------------

// Un fichier du schéma `schema` avec un personnage : `champs` remplace ceux de la feuille complète.
function fichierAvec(schema, champs) {
  const fichier = complet();
  fichier.schema = schema;
  Object.assign(fichier.personnages[0], champs);
  return fichier;
}

// Des bonus à la main : [valeur, raison] → { valeur, raison }.
const aLaMain = (...bonus) => bonus.map(([valeur, raison]) => ({ valeur, raison }));

test('complétion : une chaîne devient un objet sans bonus', () => {
  const lu = lire(fichierAvec(3, { possessions: ['Corde', { texte: 'Lanterne', bonus: null }] })).personnages[0];
  assert.deepEqual(lu.possessions, [{ texte: 'Corde', bonus: null }, { texte: 'Lanterne', bonus: null }]);
});

test('complétion : un bonus d\'objet invalide devient null ; un bonus valide perd ses champs inconnus', () => {
  const invalides = [
    undefined, 'combat', 3, [], { cible: 'chance', valeur: 1 }, { cible: 'combat', valeur: 0 }, { cible: 'combat', valeur: 1.5 },
    { cible: 'combat', valeur: '1' }, { valeur: 1 }, { cible: 'Combat', valeur: 1 },
  ];
  const possessions = invalides.map((bonus, i) => ({ texte: `Objet ${i}`, bonus }));
  possessions.push({ texte: 'Bouclier', bonus: { cible: 'defense', valeur: 2, note: 'rouillé' } });
  const lu = lire(fichierAvec(3, { possessions })).personnages[0].possessions;
  assert.deepEqual(lu.slice(0, invalides.length).map((o) => o.bonus), invalides.map(() => null));
  assert.deepEqual(lu.at(-1), { texte: 'Bouclier', bonus: { cible: 'defense', valeur: 2 } });
});

test('complétion : un champ inconnu d\'un objet est conservé ; un objet sans texte est retiré', () => {
  const lu = lire(fichierAvec(3, {
    possessions: [{ texte: 'Épée', bonus: { cible: 'combat', valeur: 1 }, poids: 2 }, { texte: '' }, { bonus: null }, { texte: 4 }, ['Corde']],
  })).personnages[0];
  assert.deepEqual(lu.possessions, [{ texte: 'Épée', bonus: { cible: 'combat', valeur: 1 }, poids: 2 }]);
});

test('rattachement : le Gilet en cuir à la main d\'un pré-tiré de la v0.3 passe sur l\'objet, les totaux ne bougent pas', () => {
  const fichier = fichierAvec(2, {
    competences: { ...feuilleComplete().competences, combat: { initiale: 5, actuelle: 5, bonus: [] } },
    defense: { bonus: aLaMain([1, 'Gilet en cuir']) },
    possessions: ['Lance', 'Gilet en cuir'],
  });
  const lu = lire(fichier).personnages[0];
  assert.deepEqual(lu.possessions, [{ texte: 'Lance', bonus: null }, { texte: 'Gilet en cuir', bonus: { cible: 'defense', valeur: 1 } }]);
  assert.deepEqual(lu.defense.bonus, []);
  assert.equal(defense(lu), 2 + 5 + 1);
});

test('rattachement : la casse et les espaces de bord n\'empêchent pas', () => {
  const lu = lire(fichierAvec(2, {
    competences: { ...feuilleComplete().competences, combat: { initiale: 5, actuelle: 5, bonus: aLaMain([2, '  ÉPÉE de Marlock ']) } },
    defense: { bonus: [] },
    possessions: [' épée DE marlock'],
  })).personnages[0];
  assert.deepEqual(lu.possessions, [{ texte: ' épée DE marlock', bonus: { cible: 'combat', valeur: 2 } }]);
  assert.deepEqual(lu.competences.combat.bonus, []);
});

test('rattachement : un bonus sans objet du même nom reste à la main', () => {
  const lu = lire(fichierAvec(2, {
    competences: { ...feuilleComplete().competences, charisme: { initiale: 2, actuelle: 2, bonus: aLaMain([-1, 'Cicatrice']) } },
    defense: { bonus: aLaMain([1, 'Gilet de cuir']) },
    possessions: ['Gilet en cuir'],
  })).personnages[0];
  assert.deepEqual(lu.possessions, [{ texte: 'Gilet en cuir', bonus: null }]);
  assert.deepEqual(lu.competences.charisme.bonus, aLaMain([-1, 'Cicatrice']));
  assert.deepEqual(lu.defense.bonus, aLaMain([1, 'Gilet de cuir']));
});

test('rattachement : les cibles dans l\'ordre de CIBLES, les bonus de la fin vers le début, le premier objet sans bonus', () => {
  const competences = feuilleComplete().competences;
  competences.charisme.bonus = [];
  competences.combat.bonus = aLaMain([1, 'Épée'], [2, 'Épée'], [3, 'Épée']);
  const lu = lire(fichierAvec(2, {
    competences,
    defense: { bonus: aLaMain([4, 'Épée'], [1, 'Bouclier']) },
    possessions: ['Épée', 'Corde', 'Épée', { texte: 'Bouclier', bonus: { cible: 'defense', valeur: 2 } }, 'Bouclier'],
  })).personnages[0];
  assert.deepEqual(lu.possessions.map((o) => o.bonus), [
    { cible: 'combat', valeur: 3 }, null, { cible: 'combat', valeur: 2 }, { cible: 'defense', valeur: 2 }, { cible: 'defense', valeur: 1 },
  ]);
  assert.deepEqual(lu.competences.combat.bonus, aLaMain([1, 'Épée']));
  assert.deepEqual(lu.defense.bonus, aLaMain([4, 'Épée']));
});

test('rattachement : un personnage du schéma 3 n\'est pas rattaché', () => {
  const champs = {
    defense: { bonus: aLaMain([1, 'Gilet en cuir']) },
    possessions: [{ texte: 'Gilet en cuir', bonus: null }],
  };
  const lu = lire(fichierAvec(3, champs)).personnages[0];
  assert.deepEqual(lu.possessions, champs.possessions);
  assert.deepEqual(lu.defense.bonus, champs.defense.bonus);
});

test('rattachement : aussi à la lecture du stockage (completerPersonnage), le personnage d\'origine ne change pas', () => {
  const brut = { id: 'l', nom: 'Liana', defense: { bonus: aLaMain([1, 'Gilet en cuir']) }, possessions: ['Lance', 'Gilet en cuir'] };
  const avant = structuredClone(brut);
  const lu = completerPersonnage(brut);
  assert.deepEqual(lu.possessions[1], { texte: 'Gilet en cuir', bonus: { cible: 'defense', valeur: 1 } });
  assert.deepEqual(lu.defense.bonus, []);
  assert.deepEqual(brut, avant);
});

test('lire un fichier du schéma 3 ne change rien (sauf le journal, les codes et les cases vides) ; le même au schéma 6 lève SCHEMA_RECENT', () => {
  const fichier = fichierAvec(3, {
    possessions: [
      { texte: 'Lance de qualité', bonus: { cible: 'combat', valeur: 1 } },
      { texte: 'Corde', bonus: null },
      { texte: 'Anneau terni', bonus: { cible: 'charisme', valeur: -1 } },
    ],
  });
  for (const liste of Object.keys({ ...JOURNAL_VIDE, ...LISTES_VIDES })) delete fichier.personnages[0][liste];
  const attendus = fichier.personnages.map((p) => ({ ...p, ...JOURNAL_VIDE, ...LISTES_VIDES }));
  const donnees = lire(JSON.parse(JSON.stringify(fichier)));
  assert.equal(donnees.schema, 5);
  assert.deepEqual(donnees.personnages, attendus);
  assert.deepEqual(lire(construireExport(donnees.personnages)).personnages, attendus);
  assert.throws(() => lire({ ...fichier, schema: 6 }), (erreur) => erreur.code === 'SCHEMA_RECENT');
});

// ---- Lot v0.6 — le schéma 4 : le journal --------------------------------------------------------------------

// Un fichier du schéma 3 : la feuille complète, sans les quatre listes du journal.
function fichierSchema3() {
  const fichier = fichierAvec(3, {});
  for (const liste of Object.keys(JOURNAL_VIDE)) delete fichier.personnages[0][liste];
  return fichier;
}

test('complétion : un personnage du schéma 3 reçoit les quatre listes vides, rien d\'autre ne change', () => {
  const fichier = fichierSchema3();
  const lu = lire(fichier).personnages[0];
  assert.deepEqual(lu, { ...fichier.personnages[0], ...JOURNAL_VIDE });
  assert.deepEqual(Object.keys(lu).slice(-4), ['historique', 'quetes', 'notes', 'combats']);
});

test('complétion : une liste du journal qui n\'est pas un tableau devient []', () => {
  for (const liste of Object.keys(JOURNAL_VIDE)) {
    for (const valeur of [undefined, null, 'texte', 3, { a: 1 }]) assert.deepEqual(relu(liste, valeur)[liste], [], `${liste} ${String(valeur)}`);
  }
});

test('complétion : historique, une entrée invalide est retirée ; un champ inconnu d\'une entrée gardée est conservé', () => {
  const historique = [
    { livre: 1, section: 12, note: 'gué' }, { livre: 0, section: 3 }, { livre: 1, section: 0 }, { livre: 1, section: null },
    { livre: '1', section: 4 }, { livre: 1.5, section: 4 }, { livre: 1 }, null, 'x', [1, 2], { livre: 2, section: 30 },
  ];
  assert.deepEqual(relu('historique', historique).historique, [{ livre: 1, section: 12, note: 'gué' }, { livre: 2, section: 30 }]);
});

test('complétion : 205 entrées d\'historique → les 200 dernières', () => {
  const historique = Array.from({ length: 205 }, (_, i) => ({ livre: 1, section: i + 1 }));
  const lu = relu('historique', historique).historique;
  assert.equal(lu.length, 200);
  assert.deepEqual(lu[0], { livre: 1, section: 6 });
  assert.deepEqual(lu.at(-1), { livre: 1, section: 205 });
  // Les invalides sortent d'abord : 200 valides et 5 invalides restent toutes les 200.
  const melange = [...historique.slice(0, 200), ...Array.from({ length: 5 }, () => ({ livre: 0, section: 1 }))];
  assert.deepEqual(relu('historique', melange).historique, historique.slice(0, 200));
});

test('complétion : quêtes, sans titre retirée ; personnages "" ; sections nettoyées ; terminee non booléen → false', () => {
  const quetes = [
    { titre: 'Trouver Aldo', personnages: 4, sections: [{ livre: 1, section: 112 }, { livre: 1, section: 0 }, 'x'], terminee: 'oui', note: 'n' },
    { titre: '' }, { titre: 3 }, { personnages: 'Orlo' }, null, 'Quête', [],
    { titre: 'Lettre', sections: 'non', terminee: true },
    { titre: 'Plume', personnages: 'Hesta', sections: [], terminee: 1 },
  ];
  assert.deepEqual(relu('quetes', quetes).quetes, [
    { titre: 'Trouver Aldo', personnages: '', sections: [{ livre: 1, section: 112 }], codes: [], terminee: false, note: 'n' },
    { titre: 'Lettre', personnages: '', sections: [], codes: [], terminee: true },
    { titre: 'Plume', personnages: 'Hesta', sections: [], codes: [], terminee: false },
  ]);
});

test('complétion : notes, sans texte retirée ; livre, section null si non entiers ; ecrite_le non chaîne → la référence', () => {
  const notes = [
    { texte: 'Un', livre: 1, section: 87, ecrite_le: '2026-10-24T18:40:00.000Z', epingle: true },
    { texte: '' }, { texte: 5 }, { livre: 1 }, null, 'Note',
    { texte: 'Deux', livre: '1', section: 2.5, ecrite_le: 42 },
  ];
  assert.deepEqual(relu('notes', notes).notes, [
    { texte: 'Un', livre: 1, section: 87, ecrite_le: '2026-10-24T18:40:00.000Z', epingle: true },
    { texte: 'Deux', livre: null, section: null, ecrite_le: '2026-10-23T14:00:00.000Z' },
  ]);
  // À la lecture du stockage, sans exporte_le : l'époque zéro.
  const brut = { id: 'n', nom: 'Nora', notes: [{ texte: 'Trois' }] };
  assert.deepEqual(completerPersonnage(brut).notes, [{ texte: 'Trois', livre: null, section: null, ecrite_le: '1970-01-01T00:00:00.000Z' }]);
});

test('complétion : combats, sans nom retiré ; Combat, Défense 0 ; Endurance ramenée dans [0, max] ; termine non booléen → false', () => {
  const combats = [
    { nom: 'Loup', combat: -1, defense: 2.5, endurance: { max: 9, actuelle: 12 }, livre: 1, section: 'x', termine: 'non', note: 'n' },
    { nom: '' }, { nom: 7 }, { combat: 3 }, null, 'Ours',
    { nom: 'Ours', combat: 6, defense: 8, endurance: { max: 10, actuelle: -3 }, livre: 1, section: 40, termine: true },
    { nom: 'Rat', combat: '2', endurance: 'beaucoup' },
  ];
  assert.deepEqual(relu('combats', combats).combats, [
    { nom: 'Loup', combat: 0, defense: 0, endurance: { max: 9, actuelle: 9 }, livre: 1, section: null, termine: false, note: 'n' },
    { nom: 'Ours', combat: 6, defense: 8, endurance: { max: 10, actuelle: 0 }, livre: 1, section: 40, termine: true },
    { nom: 'Rat', combat: 0, defense: 0, endurance: { max: 0, actuelle: 0 }, livre: null, section: null, termine: false },
  ]);
});

test('lire un fichier du schéma 4 ne change rien (sauf les codes et les cases vides) ; schema: 6 lève SCHEMA_RECENT', () => {
  const fichier = complet();
  fichier.schema = 4;
  for (const liste of Object.keys(LISTES_VIDES)) delete fichier.personnages[0][liste];
  for (const quete of fichier.personnages[0].quetes) delete quete.codes;
  fichier.personnages[0].historique = Array.from({ length: 200 }, (_, i) => ({ livre: 1 + (i % 2), section: i + 1 }));
  fichier.personnages[0].combats.push({ nom: 'Brigand', combat: 5, defense: 8, endurance: { max: 12, actuelle: 0 }, livre: null, section: null, termine: true });
  const attendus = fichier.personnages.map((p) => ({ ...p, quetes: p.quetes.map((q) => ({ ...q, codes: [] })), ...LISTES_VIDES }));
  const donnees = lire(JSON.parse(JSON.stringify(fichier)));
  assert.equal(donnees.schema, 5);
  assert.deepEqual(donnees.personnages, attendus);
  assert.deepEqual(lire(JSON.parse(JSON.stringify(construireExport(donnees.personnages)))).personnages, attendus);
  assert.throws(() => lire({ ...fichier, schema: 6 }), (erreur) => erreur.code === 'SCHEMA_RECENT');
});

test('personnageNeuf : les quatre listes vides, après pretire, dans l\'ordre historique, quetes, notes, combats, puis codes, cases', () => {
  const neuf = personnageNeuf('Dalia', 'Voleuse', new Date('2026-10-25T10:00:00.000Z'), 'id-neuf');
  const cles = Object.keys(neuf);
  assert.deepEqual(cles.slice(cles.indexOf('pretire')), ['pretire', 'historique', 'quetes', 'notes', 'combats', 'codes', 'cases']);
  for (const liste of Object.keys({ ...JOURNAL_VIDE, ...LISTES_VIDES })) assert.deepEqual(neuf[liste], [], liste);
});

// ---- Lot v0.7 — le schéma 5 : les codes, les cases de section, les codes liés d'une quête --------------------

test('complétion : un personnage du schéma 4 reçoit codes, cases et quetes[].codes vides, rien d\'autre ne change', () => {
  const fichier = complet();
  fichier.schema = 4;
  const brut = fichier.personnages[0];
  for (const liste of Object.keys(LISTES_VIDES)) delete brut[liste];
  delete brut.quetes[0].codes;
  brut.quetes.push({ titre: 'Lettre', personnages: '', sections: [], terminee: true });
  const lu = lire(fichier).personnages[0];
  assert.deepEqual(lu, { ...brut, quetes: brut.quetes.map((q) => ({ ...q, codes: [] })), ...LISTES_VIDES });
  assert.deepEqual(Object.keys(lu).slice(-2), ['codes', 'cases']);
});

test('complétion : codes, cases et quetes[].codes qui ne sont pas un tableau deviennent []', () => {
  for (const valeur of [undefined, null, 'Aide', 3, { a: 1 }]) {
    assert.deepEqual(relu('codes', valeur).codes, [], `codes ${String(valeur)}`);
    assert.deepEqual(relu('cases', valeur).cases, [], `cases ${String(valeur)}`);
    const quetes = [{ titre: 'Une', personnages: '', sections: [], codes: valeur, terminee: false }];
    assert.deepEqual(relu('quetes', quetes).quetes[0].codes, [], `quetes ${String(valeur)}`);
  }
});

test('complétion : codes non textes ou vides retirés ; d\'un doublon, la première occurrence reste (aussi dans une quête)', () => {
  const codes = ['Azur', '', 3, null, 'Aide', 'Azur', ['Air'], 'Aide', 'Air'];
  assert.deepEqual(relu('codes', codes).codes, ['Azur', 'Aide', 'Air']);
  const quetes = [{ titre: 'Une', personnages: '', sections: [], codes, terminee: false }];
  assert.deepEqual(relu('quetes', quetes).quetes[0].codes, ['Azur', 'Aide', 'Air']);
});

test('complétion : cases, une ligne sans rang valide ou mal formée est retirée ; rangs dédoublonnés et triés', () => {
  const cases = [
    { livre: 1, section: 19, libelle: '', rangs: [2, 0, 2, -1, 1.5, '1', null, 0] },
    { livre: 1, section: 16, libelle: '', rangs: [] },
    { livre: 1, section: 91, libelle: '', rangs: [-1, 'x'] },
    { livre: 1, section: 116, libelle: '', rangs: 'tout' },
    { livre: 1, section: 116, libelle: '' },
    { livre: 0, section: 10, libelle: '', rangs: [0] },
    { livre: 1, section: 0, libelle: '', rangs: [0] },
    { livre: '1', section: 10, libelle: '', rangs: [0] },
    { livre: 1, section: 10.5, libelle: '', rangs: [0] },
    { livre: 1, section: 10, rangs: [0] },
    { livre: 1, section: 10, libelle: 3, rangs: [0] },
    null, 'case', [1, 10, '', [0]],
    { livre: 1, section: 10, libelle: 'chez_vous', rangs: [0] },
    { livre: 2, section: 5, libelle: 'ailleurs', rangs: [9, 7] },
  ];
  assert.deepEqual(relu('cases', cases).cases, [
    { livre: 1, section: 19, libelle: '', rangs: [0, 2] },
    { livre: 1, section: 10, libelle: 'chez_vous', rangs: [0] },
    { livre: 2, section: 5, libelle: 'ailleurs', rangs: [7, 9] },
  ]);
});

test('complétion : un champ inconnu d\'une ligne de cases gardée est conservé ; un rang au-delà du livret reste écrit', () => {
  const cases = [{ livre: 1, section: 91, libelle: '', rangs: [5, 0], note: 'au crayon' }];
  assert.deepEqual(relu('cases', cases).cases, [{ livre: 1, section: 91, libelle: '', rangs: [0, 5], note: 'au crayon' }]);
});

test('lire un fichier du schéma 5 ne change rien ; l\'export le relit à l\'identique', () => {
  const fichier = complet();
  fichier.personnages[0].codes = ['Azur', 'Abandonné', 'Aide'];
  fichier.personnages[0].cases = [
    { livre: 1, section: 10, libelle: '', rangs: [0, 1, 3] },
    { livre: 1, section: 100, libelle: 'chez_vous', rangs: [0] },
    { livre: 1, section: 19, libelle: '', rangs: [2] },
  ];
  fichier.personnages[0].quetes.push({ titre: 'Lettre', personnages: '', sections: [], codes: ['Alissia', 'Aide'], terminee: true });
  const donnees = lire(JSON.parse(JSON.stringify(fichier)));
  assert.equal(donnees.schema, 5);
  assert.deepEqual(donnees.personnages, fichier.personnages);
  assert.deepEqual(lire(JSON.parse(JSON.stringify(construireExport(donnees.personnages)))).personnages, fichier.personnages);
});

test('completerPersonnage (le stockage) : les codes et les cases complétés, le personnage d\'origine ne change pas', () => {
  const brut = { id: 'c', nom: 'Corin', codes: ['Aide', 'Aide', ''], cases: [{ livre: 1, section: 19, libelle: '', rangs: [1, 1] }] };
  const avant = structuredClone(brut);
  const lu = completerPersonnage(brut);
  assert.deepEqual(lu.codes, ['Aide']);
  assert.deepEqual(lu.cases, [{ livre: 1, section: 19, libelle: '', rangs: [1] }]);
  assert.deepEqual(brut, avant);
});
