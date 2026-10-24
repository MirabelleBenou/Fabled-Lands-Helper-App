// Lot banc-v1 — l'auto-essai : la preuve que le banc mesure ce qu'il dit.
// Il passe les instruments sur la mini-application d'essai saine, puis sur des copies portant chacune
// un seul défaut planté (D1 à D16), et vérifie que la mesure visée bouge comme attendu, et elle seule.
// Lot v0.3 — D17 et D18 : les liens déclarés de js/liens.js (LIENS) ne comptent pas dans « externes », ailleurs si.
// Usage : node banc/autotest.mjs [--sortie <dossier>]   (captures de l'essai sain ; défaut banc/sorties/autotest)
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { echec, lireArguments } from './lib/args.mjs';
import { empreinteDossier } from './lib/fichiers.mjs';

const BANC = dirname(fileURLToPath(import.meta.url));
let args;
try {
  args = lireArguments(process.argv.slice(2), { sortie: 'valeur' });
} catch (e) {
  echec(`${e.message}\nusage : node banc/autotest.mjs [--sortie <dossier>]`);
}
if (args.positionnels.length !== 0) echec('usage : node banc/autotest.mjs [--sortie <dossier>]');
const sortieSain = args.options.sortie ? resolve(args.options.sortie) : join(BANC, 'sorties', 'autotest');
const CONTROLES = join(BANC, 'essai-controles.json');

const racine = mkdtempSync(join(tmpdir(), 'banc-autotest-'));
let total = 0;
let reussies = 0;

function verifier(id, description, condition, mesure) {
  total += 1;
  if (condition) reussies += 1;
  process.stdout.write(`${condition ? 'ok   ' : 'ECHEC'} ${id} ${description}${mesure !== undefined ? ` [${mesure}]` : ''}\n`);
  return condition;
}

// Une copie neuve de l'essai (et de ses sauvegardes de référence) sous un nom donné.
function copier(nom) {
  const dossier = join(racine, nom);
  cpSync(join(BANC, 'essai'), join(dossier, 'app'), { recursive: true });
  cpSync(join(BANC, 'essai-sauvegardes'), join(dossier, 'sauvegardes'), { recursive: true });
  return { app: join(dossier, 'app'), sauvegardes: join(dossier, 'sauvegardes'), racine: dossier };
}

function lancer(script, arguments_) {
  const r = spawnSync(process.execPath, [join(BANC, script), ...arguments_], { encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${script} a échoué (code ${r.status}) : ${(r.stderr || '').trim()}`);
  return r.stdout;
}

const rituel = (c) => lancer('rituel.mjs', [c.app, '--sauvegardes', c.sauvegardes]);
const ecran = (c, sortie) => lancer('ecran.mjs', [c.app, CONTROLES, '--sortie', sortie ?? join(c.racine, 'sorties')]);

const lignesDe = (texte) => texte.split('\n').filter((l) => l !== '');
const cle = (ligne) => ligne.slice(0, ligne.indexOf(':'));
const parLigne = (texte) => Object.fromEntries(lignesDe(texte).map((l) => [cle(l), l]));
const entier = (ligne, champ) => Number(new RegExp(`${champ}=(\\d+)`).exec(ligne)[1]);
// Ajuste de « delta » les champs « nom=entier » d'une ligne.
const ajuster = (ligne, deltas) => Object.entries(deltas).reduce(
  (l, [champ, delta]) => l.replace(new RegExp(`${champ}=(\\d+)`), `${champ}=${entier(l, champ) + delta}`), ligne);

function lireEcran(texte) {
  const lignes = lignesDe(texte);
  const rendus = lignes.filter((l) => !l.startsWith(' ') && !l.startsWith('ecran:')).map((l) => {
    const m = /^(\S+) (\S+) (\S+) (\S+) verifs=(\d+)\/(\d+) console=(\d+) externes=(\d+) debord=(\d+)$/.exec(l);
    return { cas: m[1], largeur: m[2], langue: m[3], theme: m[4], ok: +m[5], n: +m[6], console: +m[7], externes: +m[8], debord: +m[9] };
  });
  const m = /^ecran: rendus=(\d+) verifs=(\d+)\/(\d+) console=(\d+) externes=(\d+) debords=(\d+) horsligne_reel=(\S+)$/.exec(lignes[lignes.length - 1]);
  return {
    rendus, lignes,
    resume: { rendus: +m[1], ok: +m[2], n: +m[3], console: +m[4], externes: +m[5], debords: +m[6], horsligne: m[7] },
  };
}

const lire = (c, chemin) => readFileSync(join(c.app, chemin), 'utf8');
const ecrire = (c, chemin, texte) => { mkdirSync(dirname(join(c.app, chemin)), { recursive: true }); writeFileSync(join(c.app, chemin), texte); };
function remplacer(c, chemin, avant, apres) {
  const texte = lire(c, chemin);
  if (!texte.includes(avant)) throw new Error(`plantation impossible : « ${avant} » absent de ${chemin}`);
  ecrire(c, chemin, texte.replace(avant, apres));
}

try {
  // ---- L'essai sain ------------------------------------------------------------------------------
  const sain = copier('sain');
  const empreinteAvant = empreinteDossier(sain.app);
  const sortieRituel = rituel(sain);
  const lignesSaines = parLigne(sortieRituel);
  const L = lignesSaines;

  verifier('sain', 'rituel : onze lignes', lignesDe(sortieRituel).length === 11, lignesDe(sortieRituel).length);
  verifier('sain', 'caches 0', L.caches === 'caches: 0', L.caches);
  const [, synOk, synTotal] = /^syntaxe: (\d+)\/(\d+)$/.exec(L.syntaxe);
  verifier('sain', 'syntaxe total/total', synOk === synTotal && +synTotal > 0, L.syntaxe);
  const mt = /^tests: (\d+) passed, (\d+) failed$/.exec(L.tests);
  verifier('sain', 'tests : au moins 2 passés, 0 échoué', !!mt && +mt[1] >= 2 && +mt[2] === 0, L.tests);
  const ms = /^sauvegardes: lues=(\d+)\/(\d+) schema=(\S+)$/.exec(L.sauvegardes);
  verifier('sain', 'sauvegardes : toutes lues, au moins une, schema=1', !!ms && ms[1] === ms[2] && +ms[2] >= 1 && ms[3] === '1', L.sauvegardes);
  verifier('sain', 'i18n : manquantes=0 orphelines=0 inconnues=0, au moins 3 clés',
    /manquantes=0 orphelines=0 inconnues=0$/.test(L.i18n) && entier(L.i18n, 'fr') >= 3 && entier(L.i18n, 'en') >= 3, L.i18n);
  verifier('sain', 'horsligne : externes=0 manquants=0 en_trop=0',
    entier(L.horsligne, 'externes') === 0 && entier(L.horsligne, 'manquants') === 0 && entier(L.horsligne, 'en_trop') === 0, L.horsligne);
  verifier('sain', 'version : coherente=oui', /coherente=oui$/.test(L.version), L.version);
  verifier('sain', 'changelog : a_completer=0', L.changelog === 'changelog: a_completer=0', L.changelog);

  rmSync(sortieSain, { recursive: true, force: true });
  mkdirSync(sortieSain, { recursive: true });
  const sortieEcran = ecran(sain, sortieSain);
  const e = lireEcran(sortieEcran);
  verifier('sain', 'écran : au moins 16 rendus', e.resume.rendus >= 16 && e.rendus.length === e.resume.rendus, e.resume.rendus);
  verifier('sain', 'écran : toutes les vérifications passées', e.resume.ok === e.resume.n && e.resume.n > 0, `${e.resume.ok}/${e.resume.n}`);
  verifier('sain', 'écran : console=0 externes=0 debords=0',
    e.resume.console === 0 && e.resume.externes === 0 && e.resume.debords === 0, `console=${e.resume.console} externes=${e.resume.externes} debords=${e.resume.debords}`);
  verifier('sain', 'écran : horsligne_reel=ok', e.resume.horsligne === 'ok', e.resume.horsligne);
  const attendues = e.rendus.map((r) => `${r.cas}_${r.largeur}_${r.langue}_${r.theme}.png`);
  const presentes = readdirSync(sortieSain).filter((f) => f.endsWith('.png'));
  verifier('sain', 'écran : une capture par rendu, nommée <cas>_<largeur>_<langue>_<theme>.png',
    presentes.length >= 16 && attendues.every((n) => presentes.includes(n)), `${presentes.length} captures`);
  verifier('sain', 'écran : rendus dans l\'ordre cas, largeur, langue, thème',
    e.rendus.map((r) => `${r.cas} ${r.largeur} ${r.langue} ${r.theme}`).join('|') ===
    ['accueil', 'perso'].flatMap((c) => ['tablette', 'telephone'].flatMap((w) => ['fr', 'en'].flatMap((l) => ['jour', 'chandelle'].map((t) => `${c} ${w} ${l} ${t}`)))).join('|'));

  // Déterminisme (C6) et dossier mesuré intact (C7).
  verifier('sain', 'rituel déterministe (deux exécutions identiques)', rituel(sain) === sortieRituel);
  verifier('sain', 'écran déterministe (lignes de rendu identiques sur deux exécutions)', ecran(sain) === sortieEcran);
  verifier('sain', 'mesure commune déterministe', lancer('ecart.mjs', [sain.app, sain.app]) === 'ecart: ajoutes=0 modifies=0 retires=0\n');
  verifier('sain', 'dossier mesuré intact (empreinte avant = après rituel et écran)', empreinteDossier(sain.app) === empreinteAvant);

  // ---- Les défauts du rituel (D1 à D10) : la ligne visée bouge, les autres non --------------------
  const defautsRituel = [
    { id: 'D1', cible: 'caches', nom: 'un fichier sous node_modules',
      planter: (c) => ecrire(c, 'node_modules/x/README.md', '# x\n'),
      attendu: (l) => `caches: ${Number(l.slice(8)) + 1}` },
    { id: 'D2', cible: 'syntaxe', nom: 'une erreur de syntaxe dans un .js de l\'application',
      planter: (c) => appendFileSync(join(c.app, 'js/app.js'), '\nconst = ;\n'),
      attendu: (l) => l.replace(/^syntaxe: (\d+)\/(\d+)$/, (_, a, b) => `syntaxe: ${a - 1}/${b}`) },
    { id: 'D3', cible: 'tests', nom: 'un test qui échoue',
      planter: (c) => appendFileSync(join(c.app, 'tests/personnages.test.js'), "\ntest('échec planté', () => assert.equal(1, 2));\n"),
      attendu: (l) => l.replace(/^tests: (\d+) passed, (\d+) failed$/, (_, p, f) => `tests: ${p} passed, ${+f + 1} failed`) },
    { id: 'D4', cible: 'sauvegardes', nom: 'une sauvegarde de référence illisible',
      planter: (c) => writeFileSync(join(c.sauvegardes, 'illisible.json'), '{"schema": 99, "personnages": []}\n'),
      attendu: (l) => l.replace(/^sauvegardes: lues=(\d+)\/(\d+)/, (_, a, b) => `sauvegardes: lues=${a}/${+b + 1}`) },
    { id: 'D5', cible: 'i18n', nom: 'une clé retirée de en.json',
      planter: (c) => { const o = JSON.parse(lire(c, 'i18n/en.json')); delete o['perso.libelle']; ecrire(c, 'i18n/en.json', `${JSON.stringify(o, null, 2)}\n`); },
      attendu: (l) => ajuster(l, { en: -1, manquantes: 1 }) },
    { id: 'D6', cible: 'i18n', nom: 'une clé utilisée dans le HTML et définie nulle part',
      planter: (c) => remplacer(c, 'index.html', '<main id="ecran"></main>', '<main id="ecran"></main>\n  <span data-i18n="inconnue.cle"></span>'),
      attendu: (l) => ajuster(l, { inconnues: 1 }) },
    { id: 'D7', cible: 'horsligne', nom: 'une URL https:// dans une feuille de style',
      planter: (c) => appendFileSync(join(c.app, 'css/style.css'), '\n.plante { background: url("https://exemple.invalid/fond.png"); }\n'),
      attendu: (l) => ajuster(l, { externes: 1 }) },
    { id: 'D8', cible: 'horsligne', nom: 'un fichier servi retiré de PRECACHE',
      planter: (c) => remplacer(c, 'js/precache.js', "  'css/style.css',\n", ''),
      attendu: (l) => ajuster(l, { precache: -1, manquants: 1 }) },
    { id: 'D9', cible: 'version', nom: 'VERSION changée sans le CHANGELOG',
      planter: (c) => remplacer(c, 'js/version.js', '"v0.0"', '"v0.1"'),
      attendu: () => 'version: code=v0.1 changelog=v0.0 cache=flh-v0.1 coherente=non' },
    { id: 'D10', cible: 'changelog', nom: 'à compléter ajouté au CHANGELOG',
      planter: (c) => appendFileSync(join(c.app, 'CHANGELOG.md'), '\n- Une ligne à compléter.\n'),
      attendu: (l) => ajuster(l, { a_completer: 1 }) },
  ];
  const LIBRES = new Set(['fichiers', 'poids', 'empreinte']);
  for (const d of defautsRituel) {
    const c = copier(d.id);
    d.planter(c);
    const mesure = parLigne(rituel(c));
    const attendue = d.attendu(lignesSaines[d.cible]);
    verifier(d.id, `${d.nom} : ${d.cible}`, mesure[d.cible] === attendue, `${lignesSaines[d.cible]} -> ${mesure[d.cible]}`);
    const autres = Object.keys(lignesSaines).filter((k) => k !== d.cible && !LIBRES.has(k));
    const bougees = autres.filter((k) => mesure[k] !== lignesSaines[k]);
    verifier(d.id, 'seule cette ligne a bougé (hors fichiers, poids, empreinte)', bougees.length === 0, bougees.length === 0 ? 'aucune autre' : bougees.join(', '));
  }

  // ---- Les défauts de l'écran (D11 à D15) -----------------------------------------------------------
  const ajouterAApp = (c, code) => appendFileSync(join(c.app, 'js/app.js'), `\n${code}\n`);
  const rendusDuCas = (r, cas) => r.rendus.filter((x) => x.cas === cas);
  const defautsEcran = [
    { id: 'D11', nom: 'un élément de 1200 px de large sur l\'écran du cas « perso »',
      planter: (c) => ajouterAApp(c, "if (location.hash === '#/perso') { const large = document.createElement('div'); large.style.width = '1200px'; large.style.height = '10px'; document.body.append(large); }"),
      juger: (r) => {
        const perso = rendusDuCas(r, 'perso');
        verifier('D11', 'débords = rendus du cas', r.resume.debords === perso.length && perso.every((x) => x.debord > 0), `debords=${r.resume.debords} pour ${perso.length} rendus`);
        verifier('D11', 'les autres mesures sont saines',
          r.resume.ok === r.resume.n && r.resume.console === 0 && r.resume.externes === 0 && r.resume.horsligne === 'ok' && rendusDuCas(r, 'accueil').every((x) => x.debord === 0));
      } },
    { id: 'D12', nom: 'une erreur écrite en console au démarrage',
      planter: (c) => ajouterAApp(c, "console.error('erreur plantée par l\\'auto-essai');"),
      juger: (r) => {
        verifier('D12', 'console = nombre de rendus', r.resume.console === r.resume.rendus, `console=${r.resume.console} pour ${r.resume.rendus} rendus`);
        verifier('D12', 'les autres mesures sont saines',
          r.resume.ok === r.resume.n && r.resume.externes === 0 && r.resume.debords === 0 && r.resume.horsligne === 'ok');
      } },
    { id: 'D13', nom: 'une image chargée depuis un hôte extérieur',
      planter: (c) => ajouterAApp(c, "document.body.append(Object.assign(new Image(), { src: 'https://exemple.invalid/x.png', alt: '' }));"),
      juger: (r) => {
        verifier('D13', 'externes >= nombre de rendus', r.resume.externes >= r.resume.rendus, `externes=${r.resume.externes} pour ${r.resume.rendus} rendus`);
        verifier('D13', 'les autres mesures sont saines (la console peut signaler l\'échec du chargement)',
          r.resume.ok === r.resume.n && r.resume.debords === 0 && r.resume.horsligne === 'ok');
      } },
    { id: 'D14', nom: 'le service worker non enregistré',
      planter: (c) => remplacer(c, 'js/app.js', "navigator.serviceWorker.register('sw.js', { type: 'module' });", '/* service worker non enregistré */'),
      juger: (r) => {
        verifier('D14', 'horsligne_reel=sans-sw', r.resume.horsligne === 'sans-sw', r.resume.horsligne);
        verifier('D14', 'les autres mesures sont saines',
          r.resume.ok === r.resume.n && r.resume.console === 0 && r.resume.externes === 0 && r.resume.debords === 0);
      } },
    { id: 'D15', nom: 'un texte de l\'écran changé en FR',
      planter: (c) => remplacer(c, 'i18n/fr.json', '"Essai du banc"', '"Essai du banc (modifié)"'),
      juger: (r) => {
        const ratees = r.rendus.filter((x) => x.ok !== x.n);
        verifier('D15', 'vérifications ratées sur des rendus FR, et eux seuls',
          ratees.length > 0 && ratees.every((x) => x.langue === 'fr') && r.rendus.filter((x) => x.langue === 'en').every((x) => x.ok === x.n),
          `${ratees.length} rendus ratés, tous FR : ${ratees.every((x) => x.langue === 'fr')}`);
        verifier('D15', 'les autres mesures sont saines',
          r.resume.console === 0 && r.resume.externes === 0 && r.resume.debords === 0 && r.resume.horsligne === 'ok');
      } },
  ];
  for (const d of defautsEcran) {
    const c = copier(d.id);
    d.planter(c);
    d.juger(lireEcran(ecran(c)));
  }

  // ---- Lot v0.3 — D17 et D18 : les liens déclarés (js/liens.js) -----------------------------------------
  // La référence : l'essai muni d'un js/liens.js à LIENS vide, déclaré dans PRECACHE ; D17 et D18 s'y comparent,
  // pour que seul le défaut planté puisse faire bouger une ligne.
  {
    const ADRESSE = 'https://exemple.invalid/fiche/';
    const avecLiens = (nom, liens) => {
      const c = copier(nom);
      ecrire(c, 'js/liens.js', `// Lien déclaré planté par l'auto-essai.\nexport const LIENS = ${liens};\n`);
      remplacer(c, 'js/precache.js', "  'js/i18n.js',\n", "  'js/i18n.js',\n  'js/liens.js',\n");
      return c;
    };
    const reference = parLigne(rituel(avecLiens('liens-reference', '{}')));
    verifier('D17', 'référence : l\'essai avec un js/liens.js à LIENS vide, horsligne à zéro',
      entier(reference.horsligne, 'externes') === 0 && entier(reference.horsligne, 'manquants') === 0 && entier(reference.horsligne, 'en_trop') === 0,
      reference.horsligne);
    const LIBRES_LIENS = new Set(['fichiers', 'poids', 'empreinte']);
    const autresBougees = (mesure, cible) => Object.keys(reference)
      .filter((k) => k !== cible && !LIBRES_LIENS.has(k) && mesure[k] !== reference[k]);

    const c17 = avecLiens('D17', `{ fiche: '${ADRESSE}' }`);
    const m17 = parLigne(rituel(c17));
    verifier('D17', 'une adresse ajoutée à LIENS dans js/liens.js : horsligne inchangé (externes reste à 0)',
      m17.horsligne === reference.horsligne && entier(m17.horsligne, 'externes') === 0, `${reference.horsligne} -> ${m17.horsligne}`);
    const b17 = autresBougees(m17, 'horsligne');
    verifier('D17', 'aucune autre ligne n\'a bougé (hors fichiers, poids, empreinte)', b17.length === 0, b17.length === 0 ? 'aucune autre' : b17.join(', '));

    const c18 = avecLiens('D18', `{ fiche: '${ADRESSE}' }`);
    appendFileSync(join(c18.app, 'js/app.js'), `\n// ${ADRESSE}\n`);
    const m18 = parLigne(rituel(c18));
    const attendue18 = ajuster(reference.horsligne, { externes: 1 });
    verifier('D18', 'la même adresse écrite dans un autre fichier : externes +1', m18.horsligne === attendue18, `${reference.horsligne} -> ${m18.horsligne}`);
    const b18 = autresBougees(m18, 'horsligne');
    verifier('D18', 'seule cette ligne a bougé (hors fichiers, poids, empreinte)', b18.length === 0, b18.length === 0 ? 'aucune autre' : b18.join(', '));
  }

  // ---- D16 : la mesure commune ---------------------------------------------------------------------
  {
    const c = copier('D16');
    ecrire(c, 'ajout.txt', 'fichier ajouté\n');
    appendFileSync(join(c.app, 'CHANGELOG.md'), '\n- Ligne modifiée.\n');
    rmSync(join(c.app, 'manifest.webmanifest'));
    const mesure = lancer('ecart.mjs', [sain.app, c.app]);
    verifier('D16', 'un ajouté, un modifié, un retiré : lignes A, M, D justes et résumé',
      mesure === 'M CHANGELOG.md\nA ajout.txt\nD manifest.webmanifest\necart: ajoutes=1 modifies=1 retires=1\n', mesure.trim().split('\n').join(' | '));
  }
} catch (erreur) {
  process.stderr.write(`erreur : ${erreur.message}\n`);
  rmSync(racine, { recursive: true, force: true });
  process.exit(2);
}
rmSync(racine, { recursive: true, force: true });
process.stdout.write(`autotest: ${reussies}/${total}\n`);
