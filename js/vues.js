// Lot v0.1 — les cinq écrans. Chaque vue rend la liste des nœuds de l'écran ; app.js les pose.
// Lot v0.2 — l'aide « Installer l'application », la section « Application » des réglages, le stockage bloqué.
// Lot v0.3 — la création et la fiche passent dans js/feuille.js ; le paragraphe des pré-tirés dans « Droits et sources ».
// Lot v0.3.1 — la ligne d'aide « l'icône n'apparaît pas », à l'accueil et dans les réglages.
// Le texte saisi ou importé n'entre jamais comme HTML : textContent ou création d'éléments.
import { t } from './i18n.js';
import { VERSION } from './version.js';
import { etatCourant, installer, verifierMisesAJour } from './pwa.js';
import { construireExport, nomFichierExport } from './sauvegarde.js';
import { ecrireReglage, estPersistant, lireReglage, stockageDisponible, tousLesPersonnages } from './stockage.js';

// Lot v0.2 — l'aide masquée pour cette ouverture de l'application, même si le réglage n'a pas pu s'écrire.
let aideMasqueeCetteFois = false;

// Crée un élément : `texte` (textContent), `classe`, `test` (data-test) ; les autres propriétés deviennent des attributs.
export function el(nom, proprietes = {}, ...enfants) {
  const element = document.createElement(nom);
  for (const [cle, valeur] of Object.entries(proprietes)) {
    if (cle === 'texte') element.textContent = valeur;
    else if (cle === 'classe') element.className = valeur;
    else if (cle === 'test') element.dataset.test = valeur;
    else element.setAttribute(cle, valeur);
  }
  element.append(...enfants);
  return element;
}

export function ligneProfession(personnage) {
  const niveau = `${t('perso.niveau')} ${personnage.niveau}`;
  return personnage.profession ? `${personnage.profession} · ${niveau}` : niveau;
}

function lieu(personnage) {
  const { livre, section } = personnage.section_en_cours;
  const debut = `${t('perso.livre')} ${livre}`;
  return section === null ? debut : `${debut} · ${t('perso.section')} ${section}`;
}

const horodatage = (iso) => Date.parse(iso) || 0;

// Lot v0.2 — l'aide de l'accueil : encadrée à la plume, le bouton « Installer » ou le geste du menu, puis « Masquer ».
function aideInstallation(etat) {
  const section = el('section', { classe: 'cadre aide-installation', test: 'aide-installation' },
    el('h2', { texte: t('installation.titre') }),
    el('p', { texte: t('installation.texte') }));
  const masquer = el('button', { classe: 'lien', type: 'button', test: 'masquer-aide', texte: t('installation.masquer') });
  masquer.addEventListener('click', async () => {
    aideMasqueeCetteFois = true;
    await ecrireReglage('aide_installation', 'masquee').catch(() => {});
    section.remove();
  });
  if (etat === 'proposable') {
    const bouton = el('button', { classe: 'bouton', type: 'button', test: 'installer', texte: t('installation.bouton') });
    bouton.addEventListener('click', () => installer());
    section.append(el('p', { classe: 'legende', test: 'installer-raccourci', texte: t('installation.raccourci') }),
      el('div', { classe: 'actions' }, bouton, masquer));
  } else {
    section.append(el('p', { classe: 'legende', test: 'installer-geste', texte: t('installation.geste') }),
      el('p', { classe: 'legende', test: 'installer-raccourci', texte: t('installation.raccourci') }),
      el('div', { classe: 'actions' }, masquer));
  }
  return section;
}

// L'accueil : le bouton « Nouveau personnage », puis les personnages du plus récemment modifié au plus ancien,
// puis l'aide à l'installation. Stockage bloqué : le titre et l'avertissement, rien d'autre.
export async function vueAccueil() {
  if (!(await stockageDisponible())) {
    return [el('h1', { texte: t('accueil.titre') }), el('p', { classe: 'erreur', test: 'stockage-bloque', texte: t('stockage.bloque') })];
  }
  const personnages = await tousLesPersonnages().catch(() => []);
  personnages.sort((a, b) => horodatage(b.modifie_le) - horodatage(a.modifie_le));
  const nouveau = el('a', { classe: 'bouton', test: 'nouveau', href: '#/nouveau', texte: t('accueil.nouveau') });
  const suite = personnages.length === 0
    ? el('p', { classe: 'vide', test: 'liste-vide', texte: t('accueil.vide') })
    : el('ul', { classe: 'liste' }, ...personnages.map((p) => el('li', {},
      el('a', { classe: 'carte cadre', test: 'perso', href: `#/perso/${encodeURIComponent(p.id)}` },
        el('span', { classe: 'nom', test: 'nom', texte: p.nom }),
        el('span', { classe: 'ligne', texte: ligneProfession(p) }),
        el('span', { classe: 'ligne', test: 'lieu', texte: lieu(p) })))));
  const etat = etatCourant();
  const masquee = aideMasqueeCetteFois || (await lireReglage('aide_installation').catch(() => null)) === 'masquee';
  const aide = etat === 'installee' || masquee ? [] : [aideInstallation(etat)];
  return [el('h1', { texte: t('accueil.titre') }), el('p', {}, nouveau), suite, ...aide];
}

function liste(nom, test, options, valeur, surChangement) {
  const select = el('select', { id: nom, name: nom, test },
    ...options.map(([code, libelle]) => el('option', { value: code, texte: libelle })));
  select.value = valeur;
  select.addEventListener('change', () => surChangement(select.value));
  return select;
}

// Les réglages : langue, ambiance, sauvegarde (export, import, stockage), application (version, mises à jour, installation).
export async function vueReglages(contexte) {
  const langue = liste('langue', 'langue',
    [['fr', t('langue.fr')], ['en', t('langue.en')]], contexte.langue(),
    async (code) => {
      await contexte.changerLangue(code);
      document.querySelector('[data-test=langue]')?.focus();
    });
  const ambiance = liste('ambiance', 'ambiance',
    [['auto', t('reglages.ambiance_auto')], ['jour', t('reglages.ambiance_jour')], ['chandelle', t('reglages.ambiance_chandelle')]],
    contexte.ambiance(), (valeur) => contexte.changerAmbiance(valeur));

  const message = el('p', { classe: 'message', role: 'status', test: 'message' });
  const dire = (texte, genre) => {
    message.className = `message ${genre}`;
    message.textContent = texte;
  };
  const fichier = el('input', { type: 'file', accept: '.json,application/json', hidden: '', test: 'fichier' });
  fichier.addEventListener('change', async () => {
    const choisi = fichier.files[0];
    fichier.value = '';
    if (!choisi) return;
    try {
      const n = await contexte.importer(JSON.parse(await choisi.text()));
      dire(t('reglages.importe', { n }), 'succes');
    } catch (e) {
      if (e.code === 'SCHEMA_RECENT') dire(t('reglages.import_recent'), 'echec');
      else dire(t('reglages.import_erreur'), 'echec');
    }
  });
  const exporter = el('button', { classe: 'bouton', type: 'button', test: 'exporter', texte: t('reglages.exporter') });
  exporter.addEventListener('click', async () => {
    const donnees = construireExport(await tousLesPersonnages().catch(() => []));
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
    const adresse = URL.createObjectURL(blob);
    const lien = el('a', { href: adresse, download: nomFichierExport() });
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(adresse), 1000);
  });
  const importer = el('button', { classe: 'bouton', type: 'button', test: 'importer', texte: t('reglages.importer') });
  importer.addEventListener('click', () => fichier.click());

  const persiste = await estPersistant();
  const stockage = el('p', {
    classe: 'legende',
    test: 'stockage',
    texte: `${t('reglages.stockage')} ${persiste ? t('reglages.stockage_oui') : t('reglages.stockage_non')}`,
  });

  // Lot v0.2 — la section « Application » : la version, la vérification des mises à jour, l'installation.
  const majMessage = el('p', { classe: 'message', role: 'status', test: 'maj-message' });
  const verifier = el('button', { classe: 'bouton', type: 'button', test: 'verifier-maj', texte: t('maj.verifier') });
  verifier.addEventListener('click', async () => {
    majMessage.textContent = t('maj.verification');
    const issue = await verifierMisesAJour();
    if (issue === 'a_jour') majMessage.textContent = t('maj.a_jour');
    else if (issue === 'telechargement') majMessage.textContent = t('maj.telechargement');
    else majMessage.textContent = t('maj.impossible');
  });
  const etat = etatCourant();
  let installation;
  if (etat === 'installee') {
    installation = el('p', { classe: 'legende', test: 'installee', texte: t('installation.installee') });
  } else if (etat === 'proposable') {
    installation = el('button', { classe: 'bouton', type: 'button', test: 'installer', texte: t('installation.bouton') });
    installation.addEventListener('click', () => installer());
  } else {
    installation = el('p', { classe: 'legende', test: 'installer-geste', texte: t('installation.geste') });
  }

  return [
    el('h1', { texte: t('reglages.titre') }),
    el('div', { classe: 'champ' }, el('label', { for: 'langue', texte: t('reglages.langue') }), langue),
    el('div', { classe: 'champ' }, el('label', { for: 'ambiance', texte: t('reglages.ambiance') }), ambiance),
    el('section', { classe: 'cadre sauvegarde' },
      el('h2', { texte: t('reglages.sauvegarde') }),
      el('p', { texte: t('reglages.sauvegarde_aide') }),
      el('div', { classe: 'actions' }, exporter, importer, fichier),
      message,
      stockage),
    el('section', { classe: 'cadre', test: 'application' },
      el('h2', { texte: t('reglages.application') }),
      el('p', { classe: 'legende', test: 'version', texte: `${t('reglages.version')} ${VERSION}` }),
      el('div', { classe: 'actions' }, verifier),
      majMessage,
      installation,
      ...(etat === 'installee' ? [] : [el('p', { classe: 'legende', test: 'installer-raccourci', texte: t('installation.raccourci') })])),
  ];
}

// Droits et sources : six paragraphes.
export async function vueApropos() {
  return [
    el('h1', { texte: t('apropos.titre') }),
    el('div', { test: 'apropos' },
      el('p', { texte: t('apropos.outil') }),
      el('p', { texte: t('apropos.oeuvre') }),
      el('p', { texte: t('apropos.sources') }),
      el('p', { texte: t('apropos.pretires') }),
      el('p', { texte: t('apropos.polices') }),
      el('p', { texte: t('apropos.donnees') })),
  ];
}
