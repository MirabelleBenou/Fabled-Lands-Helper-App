// Lot banc-v1 — le contrôle d'écran : sert un dossier, le rend dans Chromium (2 largeurs x 2 langues x
// 2 thèmes par cas), mesure, capture. Usage : node banc/ecran.mjs <dossier> <controles.json> [--sortie <dossier>]
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';
import { echec, lireArguments } from './lib/args.mjs';
import { demarrerServeur } from './lib/serveur.mjs';

const BANC = dirname(fileURLToPath(import.meta.url));
const USAGE = 'usage : node banc/ecran.mjs <dossier> <controles.json> [--sortie <dossier>]';
const LARGEURS = [
  { nom: 'tablette', largeur: 800, hauteur: 1280 },
  { nom: 'telephone', largeur: 412, hauteur: 915 },
];
const LANGUES = ['fr', 'en'];
const THEMES = ['jour', 'chandelle'];
const DELAI_PRET = 10000;

let args;
try {
  args = lireArguments(process.argv.slice(2), { sortie: 'valeur' });
} catch (e) {
  echec(`${e.message}\n${USAGE}`);
}
if (args.positionnels.length !== 2) echec(USAGE);
const dossier = resolve(args.positionnels[0]);
const fichierControles = resolve(args.positionnels[1]);
const dossierSortie = args.options.sortie ? resolve(args.options.sortie) : join(BANC, 'sorties');
if (!existsSync(dossier) || !statSync(dossier).isDirectory()) echec(`dossier introuvable : ${args.positionnels[0]}`);

// Le fichier de contrôles : lu et vérifié en entier avant tout rendu.
let cas;
try {
  const controles = JSON.parse(readFileSync(fichierControles, 'utf8'));
  if (!controles || !Array.isArray(controles.cas) || controles.cas.length === 0) throw new Error('liste « cas » absente ou vide');
  cas = controles.cas.map((c, i) => {
    if (typeof c.nom !== 'string' || c.nom === '') throw new Error(`cas ${i + 1} : nom absent`);
    if (typeof c.route !== 'string' || !c.route.startsWith('#/')) throw new Error(`cas « ${c.nom} » : route absente ou sans « #/ »`);
    if (!Array.isArray(c.verifs)) throw new Error(`cas « ${c.nom} » : verifs absentes`);
    let etat = null;
    if (c.etat !== null && c.etat !== undefined) {
      etat = JSON.parse(readFileSync(resolve(dirname(fichierControles), c.etat), 'utf8'));
    }
    for (const v of c.verifs) {
      const genre = ['compte', 'texte', 'visible'].filter((k) => k in v);
      if (typeof v.selecteur !== 'string' || genre.length !== 1) throw new Error(`cas « ${c.nom} » : vérification mal formée`);
      if (genre[0] === 'texte' && !(typeof v.texte?.fr === 'string' && typeof v.texte?.en === 'string')) {
        throw new Error(`cas « ${c.nom} » : texte attendu en fr et en`);
      }
    }
    return { nom: c.nom, route: c.route, etat, verifs: c.verifs };
  });
} catch (e) {
  echec(`fichier de contrôles illisible (${args.positionnels[1]}) : ${e.message}`);
}
mkdirSync(dossierSortie, { recursive: true });

const serveur = await demarrerServeur(dossier);

// Chromium du paquet (executablePath et args du paquet). Ses arguments le font tourner en un seul
// processus : fermer un contexte l'arrête. Chaque rendu lance donc son propre navigateur, qu'il ferme
// à la fin ; le contexte de chaque rendu est ainsi neuf, stockage vide compris.
let cheminChromium;
async function lancer() {
  return playwright.launch({ executablePath: cheminChromium, args: chromium.args, headless: true });
}
try {
  cheminChromium = await chromium.executablePath();
  await (await lancer()).close();
} catch (e) {
  await serveur.fermer();
  echec(`Chromium ne démarre pas : ${e.message.split('\n')[0]}`);
}

const nomFichier = (texte) => texte.replace(/[^\p{L}\p{N}._-]/gu, '_');

async function nouveauContexte(navigateur, taille) {
  return navigateur.newContext({
    viewport: { width: taille.largeur, height: taille.hauteur },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
}

async function attendrePret(page) {
  await page.waitForSelector('html[data-pret="1"]', { state: 'attached', timeout: DELAI_PRET });
}

// Une vérification : rend { ok, detail }.
async function verifier(page, v, langue) {
  try {
    if ('compte' in v) {
      const mesure = await page.locator(v.selecteur).count();
      return mesure === v.compte ? { ok: true } : { ok: false, detail: `${v.selecteur} compte attendu=${v.compte} mesure=${mesure}` };
    }
    if ('texte' in v) {
      const element = page.locator(v.selecteur).first();
      if ((await element.count()) === 0) return { ok: false, detail: `${v.selecteur} texte (${langue}) élément absent` };
      const mesure = ((await element.textContent()) ?? '').trim();
      const attendu = v.texte[langue];
      return mesure === attendu ? { ok: true } : { ok: false, detail: `${v.selecteur} texte (${langue}) attendu=${JSON.stringify(attendu)} mesure=${JSON.stringify(mesure)}` };
    }
    const visible = await page.locator(v.selecteur).first().isVisible();
    return visible === v.visible ? { ok: true } : { ok: false, detail: `${v.selecteur} visible attendu=${v.visible} mesure=${visible}` };
  } catch (e) {
    return { ok: false, detail: `${v.selecteur} erreur : ${e.message.split('\n')[0]}` };
  }
}

const totaux = { rendus: 0, ok: 0, verifs: 0, console: 0, externes: 0, debords: 0 };
const sortie = [];

async function rendre(c, taille, langue, theme) {
  const navigateur = await lancer();
  const contexte = await nouveauContexte(navigateur, taille);
  const page = await contexte.newPage();
  let erreurs = 0;
  let externes = new Set();
  page.on('console', (m) => { if (m.type() === 'error') erreurs += 1; });
  page.on('pageerror', () => { erreurs += 1; });
  contexte.on('request', (r) => {
    let u;
    try { u = new URL(r.url()); } catch { return; }
    if ((u.protocol === 'http:' || u.protocol === 'https:') && u.host !== serveur.hote) externes.add(r.url());
  });
  const resultats = [];
  let pret = false;
  try {
    // État : charger la page, importer, attendre la promesse ; puis repartir d'une page vierge.
    if (c.etat !== null) {
      await page.goto(`${serveur.origine}/`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__FLH__ && typeof window.__FLH__.importer === 'function', null, { timeout: DELAI_PRET });
      await page.evaluate((objet) => window.__FLH__.importer(objet), c.etat);
      await page.goto('about:blank');
    }
    // Les mesures de console et de requêtes sont celles de la page rendue.
    erreurs = 0;
    externes = new Set();
    await page.goto(`${serveur.origine}/?langue=${langue}&theme=${theme}${c.route}`, { waitUntil: 'load' });
    await attendrePret(page);
    // Laisse arriver ce qui part juste après le rendu (chargements tardifs, erreurs de console).
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    pret = true;
  } catch {
    pret = false;
  }
  for (const v of c.verifs) {
    resultats.push(pret ? await verifier(page, v, langue) : { ok: false, detail: `${v.selecteur} page non prête (data-pret absent après ${DELAI_PRET / 1000} s)` });
  }
  let debord = 0;
  try {
    debord = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      return Math.max(0, el.scrollWidth - el.clientWidth);
    });
  } catch { /* page inutilisable : débord 0 */ }
  try {
    await page.screenshot({ path: join(dossierSortie, `${nomFichier(c.nom)}_${taille.nom}_${langue}_${theme}.png`), fullPage: true });
  } catch { /* capture impossible : sans effet sur les mesures */ }
  await navigateur.close().catch(() => {});

  const ok = resultats.filter((r) => r.ok).length;
  sortie.push(`${c.nom} ${taille.nom} ${langue} ${theme} verifs=${ok}/${resultats.length} console=${erreurs} externes=${externes.size} debord=${debord}`);
  for (const r of resultats) if (!r.ok) sortie.push(`  ${r.detail}`);
  totaux.rendus += 1;
  totaux.ok += ok;
  totaux.verifs += resultats.length;
  totaux.console += erreurs;
  totaux.externes += externes.size;
  if (debord !== 0) totaux.debords += 1;
}

// Le hors-ligne réel, une fois par exécution.
async function horsLigneReel() {
  const navigateur = await lancer();
  const contexte = await nouveauContexte(navigateur, LARGEURS[0]);
  const page = await contexte.newPage();
  try {
    await page.goto(`${serveur.origine}/`, { waitUntil: 'load' });
    const pret = await page.evaluate((delai) => {
      if (!('serviceWorker' in navigator)) return false;
      return Promise.race([
        navigator.serviceWorker.ready.then(() => true),
        new Promise((resolu) => setTimeout(() => resolu(false), delai)),
      ]);
    }, DELAI_PRET);
    if (!pret) return 'sans-sw';
    await contexte.setOffline(true);
    try {
      await page.reload({ waitUntil: 'load' });
      await attendrePret(page);
      return 'ok';
    } catch {
      return 'echec';
    }
  } catch {
    return 'echec';
  } finally {
    await navigateur.close().catch(() => {});
  }
}

try {
  for (const c of cas) {
    for (const taille of LARGEURS) {
      for (const langue of LANGUES) {
        for (const theme of THEMES) await rendre(c, taille, langue, theme);
      }
    }
  }
  const horsligne = await horsLigneReel();
  sortie.push(`ecran: rendus=${totaux.rendus} verifs=${totaux.ok}/${totaux.verifs} console=${totaux.console} externes=${totaux.externes} debords=${totaux.debords} horsligne_reel=${horsligne}`);
  process.stdout.write(`${sortie.join('\n')}\n`);
} finally {
  await serveur.fermer();
}
