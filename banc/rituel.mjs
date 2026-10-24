// Lot banc-v1 — le rituel : mesure un dossier (une archive déballée) et écrit onze lignes.
// Usage : node banc/rituel.mjs <dossier> [--sauvegardes <dossier>] [--detail]
// Lot v0.3 — horsligne : les liens déclarés de js/liens.js (son export LIENS) ne comptent pas dans « externes ».
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { echec, lireArguments } from './lib/args.mjs';
import { empreinte, lignesSha, lireTexte, lister, taille } from './lib/fichiers.mjs';

const BANC = dirname(fileURLToPath(import.meta.url));

let args;
try {
  args = lireArguments(process.argv.slice(2), { sauvegardes: 'valeur', detail: 'drapeau' });
} catch (e) {
  echec(`${e.message}\nusage : node banc/rituel.mjs <dossier> [--sauvegardes <dossier>] [--detail]`);
}
if (args.positionnels.length !== 1) echec('usage : node banc/rituel.mjs <dossier> [--sauvegardes <dossier>] [--detail]');

const dossier = resolve(args.positionnels[0]);
if (!existsSync(dossier) || !statSync(dossier).isDirectory()) echec(`dossier introuvable : ${args.positionnels[0]}`);

let dossierSauvegardes;
if (args.options.sauvegardes !== undefined) {
  dossierSauvegardes = resolve(args.options.sauvegardes);
  if (!existsSync(dossierSauvegardes) || !statSync(dossierSauvegardes).isDirectory()) {
    echec(`dossier des sauvegardes introuvable : ${args.options.sauvegardes}`);
  }
} else {
  dossierSauvegardes = join(BANC, 'sauvegardes');
}
// Les sauvegardes de référence : les *.json du dossier (premier niveau), par ordre d'octets.
const sauvegardes = existsSync(dossierSauvegardes)
  ? readdirSync(dossierSauvegardes, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => join(dossierSauvegardes, e.name))
      .sort()
  : [];

const chemins = lister(dossier);
const horsTests = (c) => !c.startsWith('tests/');
const lignes = [];

// fichiers, poids
lignes.push(`fichiers: ${chemins.length}`);
lignes.push(`poids: ${chemins.reduce((somme, c) => somme + taille(dossier, c), 0)}`);

// caches
const estCache = (c) => {
  const segments = c.split('/');
  const nom = segments[segments.length - 1];
  return (
    segments.some((s) => s === 'node_modules' || s === '.npm' || s === '__pycache__') ||
    nom === '.DS_Store' || nom === 'Thumbs.db' || nom.endsWith('.log') || nom.endsWith('.pyc')
  );
};
lignes.push(`caches: ${chemins.filter(estCache).length}`);

// syntaxe (node --check sur chaque .js et .mjs, lecture seule). Les fichiers sont lus comme des modules ES,
// par l'entrée standard (--input-type=module) : `node --check fichier.js` sur un .js sans package.json
// « type: module » laisse passer une erreur de syntaxe dans un fichier qui utilise import ou export.
const scripts = chemins.filter((c) => c.endsWith('.js') || c.endsWith('.mjs'));
let syntaxeOk = 0;
for (const script of scripts) {
  const r = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: readFileSync(join(dossier, script)), encoding: 'utf8', timeout: 60000,
  });
  if (r.status === 0) syntaxeOk += 1;
  else {
    const raison = (r.stderr || '').split('\n').filter((l) => /Error/.test(l)).join(' ').trim();
    process.stderr.write(`syntaxe : échec ${script}${raison ? ` (${raison})` : ''}\n`);
  }
}
lignes.push(`syntaxe: ${syntaxeOk}/${scripts.length}`);

// tests, sauvegardes et modules du contrat : sur une copie temporaire, supprimée ensuite
const fichiersTests = chemins.filter((c) => c.startsWith('tests/') && c.endsWith('.test.js'));
let contrat = { version: null, cacheName: null, precache: null, schema: null, lues: 0, liens: null };
let ligneTests = 'tests: aucun';
const racineTmp = mkdtempSync(join(tmpdir(), 'banc-rituel-'));
try {
  const copie = join(racineTmp, 'copie');
  cpSync(dossier, copie, { recursive: true });
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;

  if (fichiersTests.length > 0) {
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...fichiersTests], {
      cwd: copie, encoding: 'utf8', env, timeout: 300000, maxBuffer: 64 * 1024 * 1024,
    });
    const valeur = (nom) => {
      const m = (r.stdout || '').match(new RegExp(`^# ${nom} (\\d+)$`, 'm'));
      return m ? Number(m[1]) : 0;
    };
    ligneTests = `tests: ${valeur('pass')} passed, ${valeur('fail') + valeur('cancelled')} failed`;
  }

  const r = spawnSync(process.execPath, [join(BANC, 'lib', 'contrat.mjs'), JSON.stringify({ dossier: copie, sauvegardes })], {
    cwd: copie, encoding: 'utf8', env, timeout: 120000, maxBuffer: 64 * 1024 * 1024,
  });
  const m = (r.stdout || '').match(/^@@CONTRAT@@ (.*)$/m);
  if (m) contrat = JSON.parse(m[1]);
  else process.stderr.write(`contrat : lecture impossible ${(r.stderr || '').trim()}\n`);
} finally {
  rmSync(racineTmp, { recursive: true, force: true });
}
lignes.push(ligneTests);
lignes.push(`sauvegardes: lues=${contrat.schema === null ? 0 : contrat.lues}/${sauvegardes.length} schema=${contrat.schema === null ? 'absent' : contrat.schema}`);

// i18n
const lireJson = (chemin) => {
  if (!chemins.includes(chemin)) return null;
  try {
    const objet = JSON.parse(lireTexte(dossier, chemin));
    return objet !== null && typeof objet === 'object' ? objet : {};
  } catch {
    process.stderr.write(`i18n : ${chemin} illisible, compté pour 0 clé\n`);
    return {};
  }
};
const fr = lireJson('i18n/fr.json');
const en = lireJson('i18n/en.json');
if (fr === null && en === null) lignes.push('i18n: absente');
else {
  const clesFr = new Set(Object.keys(fr ?? {}));
  const clesEn = new Set(Object.keys(en ?? {}));
  let manquantes = 0;
  for (const k of clesFr) if (!clesEn.has(k)) manquantes += 1;
  for (const k of clesEn) if (!clesFr.has(k)) manquantes += 1;
  const utilisees = new Set();
  for (const c of chemins.filter(horsTests)) {
    if (c.endsWith('.html')) {
      for (const m of lireTexte(dossier, c).matchAll(/\bdata-i18n\s*=\s*(["'])(.*?)\1/g)) utilisees.add(m[2]);
    } else if (c.endsWith('.js')) {
      for (const m of lireTexte(dossier, c).matchAll(/(?<![\w$])t\(\s*(["'])(.*?)\1/g)) utilisees.add(m[2]);
    }
  }
  let orphelines = 0;
  for (const k of clesFr) if (!utilisees.has(k)) orphelines += 1;
  let inconnues = 0;
  for (const k of utilisees) if (!clesFr.has(k)) inconnues += 1;
  lignes.push(`i18n: fr=${clesFr.size} en=${clesEn.size} manquantes=${manquantes} orphelines=${orphelines} inconnues=${inconnues}`);
}

// horsligne. Lot v0.3 — une occurrence située dans js/liens.js et qui commence une des valeurs de son export
// LIENS (les adresses que l'utilisateur ouvre d'un toucher) ne compte pas ; la même adresse ailleurs compte.
const EXTENSIONS_EXTERNES = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest']);
const liensDeclares = Array.isArray(contrat.liens) ? contrat.liens : [];
let externes = 0;
for (const c of chemins.filter(horsTests)) {
  if (!EXTENSIONS_EXTERNES.has(extname(c))) continue;
  const texte = lireTexte(dossier, c);
  for (const m of texte.matchAll(/https?:\/\//g)) {
    if (texte.startsWith('http://www.w3.org/', m.index)) continue;
    if (c === 'js/liens.js' && liensDeclares.some((lien) => texte.startsWith(lien, m.index))) continue;
    externes += 1;
  }
}
const aCouvrir = chemins.filter((c) => horsTests(c) && !c.endsWith('.md') && !basename(c).startsWith('LICENSE'));
const precache = contrat.precache === null ? null : new Set(contrat.precache);
const manquants = precache === null ? aCouvrir.length : aCouvrir.filter((c) => !precache.has(c)).length;
const present = new Set(chemins);
const enTrop = precache === null ? 0 : [...precache].filter((e) => !present.has(e)).length;
lignes.push(`horsligne: externes=${externes} precache=${precache === null ? 'absent' : contrat.precache.length} manquants=${manquants} en_trop=${enTrop}`);

// version
let versionChangelog = null;
if (chemins.includes('CHANGELOG.md')) {
  const m = lireTexte(dossier, 'CHANGELOG.md').match(/^## (v\d+\.\d+(?:\.\d+)?)(?!\d)/m);
  if (m) versionChangelog = m[1];
}
const code = contrat.version;
const cache = contrat.cacheName;
let coherente = 'sans-objet';
if (code !== null || versionChangelog !== null || cache !== null) {
  coherente = code !== null && versionChangelog !== null && cache !== null && code === versionChangelog && cache === `flh-${code}` ? 'oui' : 'non';
}
lignes.push(`version: code=${code ?? 'absente'} changelog=${versionChangelog ?? 'absente'} cache=${cache ?? 'absent'} coherente=${coherente}`);

// changelog
const aCompleter = chemins.includes('CHANGELOG.md')
  ? [...lireTexte(dossier, 'CHANGELOG.md').normalize('NFC').matchAll(/à compléter/giu)].length
  : 0;
lignes.push(`changelog: a_completer=${aCompleter}`);

// empreinte
const lignesDeSha = lignesSha(dossier, chemins);
lignes.push(`empreinte: ${empreinte(lignesDeSha)}`);

if (args.options.detail) {
  lignes.push('');
  lignes.push(...lignesDeSha);
}
process.stdout.write(`${lignes.join('\n')}\n`);
