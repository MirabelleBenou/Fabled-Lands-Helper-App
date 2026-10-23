// Lot v0.1 — les cinq écrans. Chaque vue rend la liste des nœuds de l'écran ; app.js les pose.
// Le texte saisi ou importé n'entre jamais comme HTML : textContent ou création d'éléments.
import { t } from './i18n.js';
import { VERSION } from './version.js';
import { construireExport, nomFichierExport, personnageNeuf } from './sauvegarde.js';
import {
  enregistrerPersonnages,
  estPersistant,
  lirePersonnage,
  supprimerPersonnage,
  tousLesPersonnages,
} from './stockage.js';

const DELAI_CONFIRMATION = 5000;

// Crée un élément : `texte` (textContent), `classe`, `test` (data-test) ; les autres propriétés deviennent des attributs.
function el(nom, proprietes = {}, ...enfants) {
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

const lienRetour = () => el('a', { classe: 'lien', href: '#/', texte: t('fiche.retour') });

function ligneProfession(personnage) {
  const niveau = `${t('perso.niveau')} ${personnage.niveau}`;
  return personnage.profession ? `${personnage.profession} · ${niveau}` : niveau;
}

function lieu(personnage) {
  const { livre, section } = personnage.section_en_cours;
  const debut = `${t('perso.livre')} ${livre}`;
  return section === null ? debut : `${debut} · ${t('perso.section')} ${section}`;
}

const horodatage = (iso) => Date.parse(iso) || 0;

// L'accueil : le bouton « Nouveau personnage », puis les personnages du plus récemment modifié au plus ancien.
export async function vueAccueil() {
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
  return [el('h1', { texte: t('accueil.titre') }), el('p', {}, nouveau), suite];
}

// Nouveau personnage : un nom obligatoire, une profession libre.
export async function vueNouveau(contexte) {
  const nom = el('input', { id: 'nom', type: 'text', name: 'nom', autocomplete: 'off', 'aria-describedby': 'nom-erreur' });
  const erreur = el('p', { classe: 'erreur', id: 'nom-erreur', role: 'alert' });
  const profession = el('input', { id: 'profession', type: 'text', name: 'profession', autocomplete: 'off' });
  const formulaire = el('form', { novalidate: '' },
    el('div', { classe: 'champ' }, el('label', { for: 'nom', texte: t('nouveau.nom') }), nom, erreur),
    el('div', { classe: 'champ' }, el('label', { for: 'profession', texte: t('nouveau.profession') }), profession),
    el('div', { classe: 'actions' },
      el('button', { classe: 'bouton', type: 'submit', test: 'creer', texte: t('nouveau.creer') }),
      el('a', { classe: 'lien', href: '#/', texte: t('nouveau.annuler') })));
  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const nomSaisi = nom.value.trim();
    if (nomSaisi === '') {
      erreur.textContent = t('nouveau.nom_requis');
      nom.setAttribute('aria-invalid', 'true');
      nom.focus();
      return;
    }
    await enregistrerPersonnages([personnageNeuf(nomSaisi, profession.value.trim())]).catch(() => {});
    contexte.naviguer('#/');
  });
  return [el('h1', { texte: t('nouveau.titre') }), formulaire];
}

// La fiche : le nom, la ligne profession · niveau, le lieu, l'annonce de la feuille, la suppression en deux touchers.
export async function vueFiche(contexte, id) {
  const personnage = await lirePersonnage(id).catch(() => null);
  if (personnage === null) {
    return [el('h1', { texte: t('fiche.introuvable') }), el('p', {}, lienRetour())];
  }
  const supprimer = el('button', { classe: 'bouton bouton-danger', type: 'button', test: 'supprimer', texte: t('fiche.supprimer') });
  let arme = false;
  let minuterie = null;
  supprimer.addEventListener('click', async () => {
    if (!arme) {
      arme = true;
      supprimer.textContent = t('fiche.confirmer');
      minuterie = setTimeout(() => {
        arme = false;
        supprimer.textContent = t('fiche.supprimer');
      }, DELAI_CONFIRMATION);
      return;
    }
    clearTimeout(minuterie);
    await supprimerPersonnage(personnage.id).catch(() => {});
    contexte.naviguer('#/');
  });
  return [
    el('h1', { texte: personnage.nom }),
    el('p', { classe: 'ligne', texte: ligneProfession(personnage) }),
    el('p', { classe: 'ligne', texte: lieu(personnage) }),
    el('p', { test: 'bientot', texte: t('fiche.bientot') }),
    el('div', { classe: 'actions' }, lienRetour(), supprimer),
  ];
}

function liste(nom, test, options, valeur, surChangement) {
  const select = el('select', { id: nom, name: nom, test },
    ...options.map(([code, libelle]) => el('option', { value: code, texte: libelle })));
  select.value = valeur;
  select.addEventListener('change', () => surChangement(select.value));
  return select;
}

// Les réglages : langue, ambiance, sauvegarde (export, import, stockage), version.
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
    el('p', { classe: 'legende', test: 'version', texte: `${t('reglages.version')} ${VERSION}` }),
  ];
}

// Droits et sources : cinq paragraphes.
export async function vueApropos() {
  return [
    el('h1', { texte: t('apropos.titre') }),
    el('div', { test: 'apropos' },
      el('p', { texte: t('apropos.outil') }),
      el('p', { texte: t('apropos.oeuvre') }),
      el('p', { texte: t('apropos.sources') }),
      el('p', { texte: t('apropos.polices') }),
      el('p', { texte: t('apropos.donnees') })),
  ];
}
