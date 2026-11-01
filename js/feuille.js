// Lot v0.3 — la feuille d'aventure : la création (pré-tiré ou saisie libre) et la fiche d'un personnage, en trois
// rubriques (Statistiques, Possessions, Cultes). Chaque changement s'enregistre aussitôt, puis l'écran se rend à
// nouveau depuis le personnage enregistré. Le texte saisi ou importé n'entre jamais comme HTML.
// Lot v0.4 — le bonus des objets : la pastille et l'éditeur du bonus de chaque possession, l'ajout avec un bonus ;
// dans les Statistiques, les pastilles et la liste des bonus d'objets.
// Lot v0.5 — les dés : la barre des dés termine la fiche (js/des.js).
// Lot v0.6 — le journal : deux rubriques de plus, Aventure (la section en cours et le chemin parcouru, les quêtes, les
// notes) et Combats (le personnage, ses adversaires, les combats passés). L'écran ne calcule rien.
// Lot v0.7 — les codes et les cases de section : une sixième rubrique, Codes (les codes du livret, puis ses cases de
// section) ; les cases de la section en cours sous son numéro (Aventure) ; les codes liés d'une quête. L'écran ne
// vérifie rien : chaque case se coche et se décoche seule.
// Lot v0.8 — les biens : une septième rubrique, Biens (les investissements, les dépôts, le navire) ; dans Possessions,
// sous les possessions transportées, les possessions stockées. L'écran ne calcule rien. Après un toucher, le focus
// revient à l'élément touché (son rang parmi ceux du même data-test).
import { barreDes } from './des.js';
import { t } from './i18n.js';
import { LIENS } from './liens.js';
import { LIVRETS, lignesDeSection } from './livret.js';
import { PRETIRES, personnagePretire, pretireParId } from './pretires.js';
import {
  CIBLES,
  COMPETENCES,
  EQUIPAGES,
  MAX_POSSESSIONS,
  acquerirNavire,
  ajouterAdversaire,
  ajouterBonus,
  ajouterCargaison,
  ajouterCodeQuete,
  ajouterEntree,
  ajouterLieu,
  ajouterNote,
  ajouterObjetStocke,
  ajouterPossession,
  ajouterQuete,
  ajouterSectionQuete,
  ajouterTitre,
  allerSection,
  basculerCode,
  bonusObjets,
  changerBase,
  changerBonusObjet,
  changerBourse,
  changerEndurance,
  changerEnduranceAdversaire,
  changerEnduranceMax,
  changerNiveau,
  changerSomme,
  cocherCase,
  defense,
  entierSaisi,
  feuilleLibre,
  finirCombat,
  modifierAdversaire,
  modifierLieu,
  modifierNavire,
  modifierQuete,
  operationBourse,
  rangsCoches,
  retirerBonus,
  retirerCargaison,
  retirerCodeQuete,
  retirerDeListe,
  retirerNavire,
  retirerObjetStocke,
  retirerSectionQuete,
  signe,
  totalCompetence,
} from './regles.js';
import { personnageNeuf } from './sauvegarde.js';
import { enregistrerPersonnages, lirePersonnage, supprimerPersonnage } from './stockage.js';
import { el, ligneProfession } from './vues.js';

const DELAI_CONFIRMATION = 5000;
const MOINS = '−';

// Les clés s'écrivent en entier : une table code → texte.
const NOM_COMPETENCE = {
  charisme: () => t('comp.charisme'),
  combat: () => t('comp.combat'),
  magie: () => t('comp.magie'),
  piete: () => t('comp.piete'),
  exploration: () => t('comp.exploration'),
  adresse: () => t('comp.adresse'),
};
const ABR_COMPETENCE = {
  charisme: () => t('abr.charisme'),
  combat: () => t('abr.combat'),
  magie: () => t('abr.magie'),
  piete: () => t('abr.piete'),
  exploration: () => t('abr.exploration'),
  adresse: () => t('abr.adresse'),
};
const RUBRIQUES = [
  ['statistiques', () => t('feuille.statistiques')],
  ['possessions', () => t('feuille.possessions')],
  ['cultes', () => t('feuille.cultes')],
  // Lot v0.6 — le journal.
  ['aventure', () => t('feuille.aventure')],
  ['combats', () => t('feuille.combats')],
  // Lot v0.7 — les codes et les cases de section.
  ['codes', () => t('feuille.codes')],
  // Lot v0.8 — les biens.
  ['biens', () => t('feuille.biens')],
];
const DEPLIABLES = [...COMPETENCES, 'defense', 'endurance'];
// Lot v0.4 — le nom d'une cible de bonus : la compétence, ou la Défense.
const nomCible = (cible) => (cible === 'defense' ? t('feuille.defense') : NOM_COMPETENCE[cible]());

const lienRetour = () => el('a', { classe: 'lien', href: '#/', texte: t('fiche.retour') });
const lienExterne = (classe, test, texte) => el('a', { classe, test, href: LIENS.pretires, target: '_blank', rel: 'noopener', texte });
// Un total : le signe moins U+2212 s'il est négatif.
const chiffre = (n) => (n < 0 ? signe(n) : String(n));

// Un compteur − valeur + : `valeur` est un nœud ou un texte, `classe` celle de la valeur (gros, moyen).
function compteur(classe, valeur, moins, plus) {
  return el('div', { classe: 'compteur' },
    el('button', { classe: 'rond', type: 'button', test: moins.test, 'aria-label': moins.libelle, texte: MOINS }),
    el('span', { classe }, ...valeur),
    el('button', { classe: 'rond', type: 'button', test: plus.test, 'aria-label': plus.libelle, texte: '+' }));
}

// ---- La création ------------------------------------------------------------------------------------------

function champNom(valeur) {
  const nom = el('input', { id: 'nom', type: 'text', name: 'nom', autocomplete: 'off', 'aria-describedby': 'nom-erreur' });
  nom.value = valeur;
  const erreur = el('p', { classe: 'erreur', id: 'nom-erreur', role: 'alert' });
  return { nom, erreur, bloc: el('div', { classe: 'champ' }, el('label', { for: 'nom', texte: t('nouveau.nom') }), nom, erreur) };
}

const actionsCreation = () => el('div', { classe: 'actions' },
  el('button', { classe: 'bouton', type: 'submit', test: 'creer', texte: t('nouveau.creer') }),
  el('a', { classe: 'lien', href: '#/', texte: t('nouveau.annuler') }));

// « Créer » : un nom requis ; `fabriquer(nom)` rend le personnage ; puis sa fiche.
function surCreation(contexte, formulaire, champ, fabriquer) {
  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const nomSaisi = champ.nom.value.trim();
    if (nomSaisi === '') {
      champ.erreur.textContent = t('nouveau.nom_requis');
      champ.nom.setAttribute('aria-invalid', 'true');
      champ.nom.focus();
      return;
    }
    const personnage = fabriquer(nomSaisi);
    try {
      await enregistrerPersonnages([personnage]);
    } catch {
      champ.erreur.textContent = t('stockage.bloque');
      return;
    }
    contexte.naviguer(`#/perso/${encodeURIComponent(personnage.id)}`);
  });
}

function cartePretire(pretire, choisi) {
  const proprietes = { classe: 'pretire cadre', test: 'pretire', href: `#/nouveau/pretire/${encodeURIComponent(pretire.id)}` };
  if (choisi) proprietes['aria-current'] = 'true';
  const mini = el('span', { classe: 'mini' }, ...COMPETENCES.map((code) => el('span', {},
    el('abbr', { title: NOM_COMPETENCE[code](), texte: ABR_COMPETENCE[code]() }), ` ${pretire.competences[code]}`)));
  const carte = el('a', proprietes,
    el('span', { classe: 'nom', texte: pretire.nom }),
    el('span', { classe: 'ligne', texte: ligneProfession(pretire) }),
    mini);
  if (pretire.exclusif) carte.append(el('span', { classe: 'puce', texte: t('pretire.exclusif') }));
  return el('li', {}, carte);
}

function modePretire(contexte, idChoisi) {
  const choisi = idChoisi === null ? null : pretireParId(idChoisi);
  // Lot v0.3.1 — en tête : le formulaire du personnage choisi, ou la consigne qui dit où il apparaîtra.
  const noeuds = [];
  if (choisi !== null) {
    const champ = champNom(choisi.nom);
    const formulaire = el('form', { novalidate: '' }, champ.bloc, actionsCreation());
    surCreation(contexte, formulaire, champ, (nom) => personnagePretire(choisi, nom));
    noeuds.push(formulaire);
  } else {
    noeuds.push(el('p', { classe: 'legende', test: 'consigne-pretire', texte: t('pretire.consigne') }));
  }
  noeuds.push(
    el('p', { classe: 'legende source-pretires', texte: t('pretire.source') }),
    lienExterne('lien', 'lien-pretires', t('pretire.lire_toutes')),
    el('ul', { classe: 'pretires' }, ...PRETIRES.map((p) => cartePretire(p, p === choisi))));
  return noeuds;
}

function champNombre(id, libelle, valeur, min) {
  const champ = el('input', { id, type: 'number', inputmode: 'numeric', min: String(min), name: id, value: String(valeur) });
  return { champ, bloc: el('div', { classe: 'champ' }, el('label', { for: id, texte: libelle }), champ) };
}

function modeLibre(contexte) {
  const champ = champNom('');
  const profession = el('input', { id: 'profession', type: 'text', name: 'profession', autocomplete: 'off' });
  const niveau = champNombre('niveau', t('perso.niveau'), 1, 1);
  const endurance = champNombre('endurance', t('feuille.endurance_max'), 0, 0);
  const bourse = champNombre('bourse', t('feuille.bourse'), 0, 0);
  const competences = COMPETENCES.map((code) => [code, champNombre(`c-${code}`, NOM_COMPETENCE[code](), 0, 0)]);
  const formulaire = el('form', { novalidate: '' },
    champ.bloc,
    el('div', { classe: 'champ' }, el('label', { for: 'profession', texte: t('nouveau.profession') }), profession),
    el('div', { classe: 'grille-nombres' }, niveau.bloc, endurance.bloc, bourse.bloc),
    el('h2', { classe: 'rubrique', texte: t('feuille.competences') }),
    el('div', { classe: 'grille-nombres' }, ...competences.map(([, c]) => c.bloc)),
    el('p', { classe: 'legende', texte: t('nouveau.libre_aide') }),
    actionsCreation());
  surCreation(contexte, formulaire, champ, (nom) => feuilleLibre(personnageNeuf(nom, profession.value.trim()), {
    niveau: niveau.champ.value,
    endurance: endurance.champ.value,
    bourse: bourse.champ.value,
    competences: Object.fromEntries(competences.map(([code, c]) => [code, c.champ.value])),
  }));
  return [formulaire];
}

// Nouveau personnage : #/nouveau, #/nouveau/pretire[/<id>], #/nouveau/libre.
export async function vueNouveau(contexte, route) {
  const mode = (code, test, href, texte) => {
    const lien = el('a', { test, href, texte });
    if (route.mode === code) lien.setAttribute('aria-current', 'page');
    return lien;
  };
  return [
    el('h1', { texte: t('nouveau.titre') }),
    el('nav', { classe: 'sous-onglets', 'aria-label': t('nouveau.mode') },
      mode('pretire', 'mode-pretire', '#/nouveau/pretire', t('nouveau.mode_pretire')),
      mode('libre', 'mode-libre', '#/nouveau/libre', t('nouveau.mode_libre'))),
    ...(route.mode === 'libre' ? modeLibre(contexte) : modePretire(contexte, route.choix)),
  ];
}

// ---- La fiche : les changements -------------------------------------------------------------------------

// Les changements passent un par un, chacun sur le personnage tel qu'il est enregistré ; la fiche attend qu'ils
// soient écrits avant de se lire. Le rendu qui suit se fait hors de la file.
let file = Promise.resolve();

function montrerErreurEcriture() {
  const onglets = document.querySelector('#ecran .sous-onglets');
  if (!onglets || document.querySelector('#ecran [data-test=erreur-ecriture]')) return;
  onglets.after(el('p', { classe: 'erreur', test: 'erreur-ecriture', texte: t('stockage.bloque') }));
}

// `transformer(personnage)` rend le personnage changé, ou null (rien à faire). Le changement s'enregistre
// (modifie_le = maintenant), puis l'écran se rend à nouveau (sauf `rendre: false`) et le focus revient à l'élément
// qui porte le data-test du déclencheur. Un enregistrement qui échoue laisse l'écran tel quel, avec l'erreur.
// Lot v0.8 — le focus va à l'élément de ce data-test au même rang que le déclencheur (noté avant d'écrire), ou au
// dernier s'il y en a moins.
// Lot v0.4 — `ancre` : une fois écrit, l'adresse va à cette ancre (l'écran s'y rend), au lieu de se rendre sur place.
async function changer(contexte, id, transformer, { declencheur = null, rendre = true, ancre = null } = {}) {
  const test = declencheur?.dataset?.test;
  const memeTest = () => document.querySelectorAll(`#ecran [data-test="${test}"]`);
  const rang = test ? Math.max([...memeTest()].indexOf(declencheur), 0) : 0;
  const travail = file.then(async () => {
    let actuel;
    try {
      actuel = await lirePersonnage(id);
    } catch {
      return 'echec';
    }
    if (actuel === null) return 'disparu';
    const nouveau = transformer(actuel);
    if (nouveau === null) return 'rien';
    nouveau.modifie_le = new Date().toISOString();
    try {
      await enregistrerPersonnages([nouveau]);
    } catch {
      return 'echec';
    }
    return 'ecrit';
  });
  file = travail.catch(() => 'echec');
  const issue = await file;
  if (issue === 'echec') montrerErreurEcriture();
  if (issue === 'ecrit' && ancre !== null && location.hash !== ancre) {
    contexte.naviguer(ancre);
    return;
  }
  if (issue === 'disparu' || (issue === 'ecrit' && rendre)) {
    await contexte.rafraichir();
    if (test) {
      const elements = memeTest();
      elements[Math.min(rang, elements.length - 1)]?.focus({ preventScroll: true });
    }
  }
}

// Un bouton (ou un élément) qui, touché, applique `transformer` ; lot v0.4 — `options` : celles de changer().
function action(element, contexte, id, transformer, options = {}) {
  element.addEventListener('click', () => changer(contexte, id, transformer, { declencheur: element, ...options }));
  return element;
}

// Lot v0.4 — la liste de choix de la cible d'un bonus d'objet : « Sans bonus », puis chaque cible de CIBLES.
function choixCible(test, valeur) {
  const choix = el('select', { test, 'aria-label': t('feuille.objet_bonus') },
    el('option', { value: '', texte: t('feuille.sans_bonus') }),
    ...CIBLES.map((cible) => el('option', { value: cible, texte: nomCible(cible) })));
  choix.value = valeur;
  return choix;
}

// Lot v0.4 — le champ nombre de la valeur d'un bonus d'objet.
const champValeurObjet = (test, valeur) => el('input', {
  type: 'number', inputmode: 'numeric', test, value: String(valeur), 'aria-label': t('feuille.valeur'),
});

// Lot v0.4 — la pastille d'un bonus d'objet : « équipement », « malus » si la valeur est négative.
const classePuceObjet = (valeur) => (valeur < 0 ? 'puce equipement malus' : 'puce equipement');

// Un champ texte et son bouton « Ajouter » ; la touche Entrée dans le champ ajoute aussi.
function ajoutTexte(contexte, id, testChamp, testBouton, libelle, ajouter, inactif = false) {
  const champ = el('input', { type: 'text', test: testChamp, placeholder: libelle, 'aria-label': libelle });
  const bouton = el('button', { classe: 'bouton', type: 'button', test: testBouton, texte: t('feuille.ajouter') });
  if (inactif) {
    champ.setAttribute('disabled', '');
    bouton.setAttribute('disabled', '');
  }
  const ajout = (declencheur) => changer(contexte, id, (p) => ajouter(p, champ.value), { declencheur });
  bouton.addEventListener('click', () => ajout(bouton));
  champ.addEventListener('keydown', (evenement) => {
    if (evenement.key !== 'Enter') return;
    evenement.preventDefault();
    ajout(champ);
  });
  return el('div', { classe: 'ajout' }, champ, bouton);
}

const boutonRetirer = (classe, texte, nom) => el('button', { classe, type: 'button', 'aria-label': t('feuille.retirer_nom', { nom }), texte });

// ---- La fiche : Statistiques ---------------------------------------------------------------------------

function blocEndurance(contexte, p, base, deplie) {
  const { max, actuelle } = p.endurance;
  const jauge = el('span');
  jauge.style.width = `${max === 0 ? 0 : Math.round((actuelle / max) * 100)}%`;
  const ouvert = deplie === 'endurance';
  const section = el('section', { classe: 'cadre endurance', test: 'endurance' },
    el('h2', { classe: 'petit-titre', texte: t('feuille.endurance') }),
    compteur('gros', [String(actuelle), el('span', { classe: 'sur', texte: ` / ${max}` })],
      { test: 'endurance-moins', libelle: t('feuille.endurance_moins') },
      { test: 'endurance-plus', libelle: t('feuille.endurance_plus') }),
    el('div', { classe: 'jauge' }, jauge),
    el('p', { classe: 'legende' },
      `${t('feuille.endurance_max')} ${max} · ${t('perso.niveau')} ${p.niveau} · `,
      el('a', { classe: 'lien', href: ouvert ? base : `${base}/endurance`, texte: t('feuille.modifier') })));
  action(section.querySelector('[data-test=endurance-moins]'), contexte, p.id, (q) => changerEndurance(q, -1));
  action(section.querySelector('[data-test=endurance-plus]'), contexte, p.id, (q) => changerEndurance(q, 1));
  if (!ouvert) return [section];

  const editeur = el('section', { classe: 'cadre editeur-stats', test: 'editeur-endurance' },
    el('div', { classe: 'groupe-edition' },
      el('h2', { classe: 'petit-titre', texte: t('feuille.endurance_max') }),
      compteur('gros', [String(max)],
        { test: 'endurance-max-moins', libelle: t('feuille.max_moins') },
        { test: 'endurance-max-plus', libelle: t('feuille.max_plus') })),
    el('div', { classe: 'groupe-edition' },
      el('h2', { classe: 'petit-titre', texte: t('perso.niveau') }),
      compteur('gros', [String(p.niveau)],
        { test: 'niveau-moins', libelle: t('feuille.niveau_moins') },
        { test: 'niveau-plus', libelle: t('feuille.niveau_plus') })),
    el('a', { classe: 'lien', href: base, texte: t('feuille.fermer') }));
  action(editeur.querySelector('[data-test=endurance-max-moins]'), contexte, p.id, (q) => changerEnduranceMax(q, -1));
  action(editeur.querySelector('[data-test=endurance-max-plus]'), contexte, p.id, (q) => changerEnduranceMax(q, 1));
  action(editeur.querySelector('[data-test=niveau-moins]'), contexte, p.id, (q) => changerNiveau(q, -1));
  action(editeur.querySelector('[data-test=niveau-plus]'), contexte, p.id, (q) => changerNiveau(q, 1));
  return [section, editeur];
}

// L'éditeur d'une ligne dépliée : la base (compétence seulement), les bonus et malus, l'ajout d'un bonus.
function editeurStat(contexte, p, cible) {
  const editeur = el('div', { classe: 'editeur', test: 'editeur' });
  if (cible !== 'defense') {
    const competence = p.competences[cible];
    const base = el('div', { classe: 'base-edition' },
      el('span', { classe: 'petit-titre', texte: t('feuille.base_actuelle') }),
      compteur('moyen', [String(competence.actuelle)],
        { test: 'base-moins', libelle: t('feuille.base_moins') },
        { test: 'base-plus', libelle: t('feuille.base_plus') }),
      el('span', { classe: 'legende', texte: t('feuille.base_initiale', { n: competence.initiale }) }));
    action(base.querySelector('[data-test=base-moins]'), contexte, p.id, (q) => changerBase(q, cible, -1));
    action(base.querySelector('[data-test=base-plus]'), contexte, p.id, (q) => changerBase(q, cible, 1));
    editeur.append(base);
  }
  // Lot v0.4 — les bonus des objets, s'il y en a : chacun mène à son objet ; celui qui ne compte pas le dit.
  const objets = bonusObjets(p, cible);
  if (objets.length > 0) {
    const racine = `#/perso/${encodeURIComponent(p.id)}`;
    editeur.append(el('p', { classe: 'petit-titre', texte: t('feuille.bonus_objets') }),
      el('ul', { classe: 'bonus-liste', test: 'bonus-objets' }, ...objets.map((b) => {
        const raison = el('span', { classe: 'raison', texte: b.raison });
        if (!b.compte) raison.append(el('span', { classe: 'legende', texte: ` — ${t('feuille.ne_compte_pas')}` }));
        return el('li', b.compte ? {} : { classe: 'ignore' },
          el('span', { classe: b.valeur < 0 ? 'valeur malus' : 'valeur', texte: signe(b.valeur) }),
          raison,
          el('a', { classe: 'lien', test: 'lien-objet', href: `${racine}/possessions/${b.index}`, texte: t('feuille.objet_modifier') }));
      })));
  }
  const bonus = cible === 'defense' ? p.defense.bonus : p.competences[cible].bonus;
  editeur.append(el('p', { classe: 'petit-titre', texte: t('feuille.bonus_malus') }));
  if (bonus.length === 0) {
    editeur.append(el('p', { classe: 'legende', texte: t('feuille.bonus_vide') }));
  } else {
    editeur.append(el('ul', { classe: 'bonus-liste' }, ...bonus.map((b, index) => el('li', {},
      el('span', { classe: b.valeur < 0 ? 'valeur malus' : 'valeur', texte: signe(b.valeur) }),
      el('span', { classe: 'raison', texte: b.raison }),
      action(boutonRetirer('lien', t('feuille.retirer'), b.raison), contexte, p.id, (q) => retirerBonus(q, cible, index))))));
  }
  const valeur = el('input', { type: 'number', inputmode: 'numeric', test: 'bonus-valeur', value: '0', 'aria-label': t('feuille.valeur') });
  const raison = el('input', { type: 'text', test: 'bonus-raison', placeholder: t('feuille.raison'), 'aria-label': t('feuille.raison') });
  const ajouter = el('button', { classe: 'bouton', type: 'button', test: 'bonus-ajouter', texte: t('feuille.ajouter') });
  action(ajouter, contexte, p.id, (q) => ajouterBonus(q, cible, valeur.value, raison.value));
  editeur.append(el('div', { classe: 'ajout-bonus' }, valeur, raison, ajouter));
  return editeur;
}

function ligneStat(contexte, p, base, deplie, cible) {
  const ouverte = deplie === cible;
  const estDefense = cible === 'defense';
  const bonus = estDefense ? p.defense.bonus : p.competences[cible].bonus;
  const formule = estDefense
    ? t('feuille.formule_defense', { niveau: p.niveau, combat: p.competences.combat.actuelle })
    : t('feuille.base', { n: p.competences[cible].actuelle });
  const entete = el('a', { classe: 'entete-stat', href: ouverte ? base : `${base}/${cible}`, 'aria-expanded': ouverte ? 'true' : 'false' },
    el('span', { classe: 'nom-stat', texte: estDefense ? t('feuille.defense') : NOM_COMPETENCE[cible]() }),
    el('span', { classe: 'detail-stat' },
      el('span', { classe: 'formule', texte: formule }),
      // Lot v0.4 — d'abord une pastille par objet (barrée s'il ne compte pas), puis les bonus à la main.
      ...bonusObjets(p, cible).map((b) => el('span', {
        classe: b.compte ? classePuceObjet(b.valeur) : `${classePuceObjet(b.valeur)} ignore`,
        test: 'puce-objet',
        texte: `${signe(b.valeur)} ${b.raison}`,
      })),
      ...bonus.map((b) => el('span', { classe: b.valeur < 0 ? 'puce malus' : 'puce', texte: `${signe(b.valeur)} ${b.raison}` }))),
    el('span', {
      classe: 'total',
      test: estDefense ? 'defense' : `total-${cible}`,
      texte: chiffre(estDefense ? defense(p) : totalCompetence(p, cible)),
    }));
  const ligne = el('li', { classe: ouverte ? 'ligne-stat ouverte' : 'ligne-stat', test: `ligne-${cible}` }, entete);
  if (ouverte) ligne.append(editeurStat(contexte, p, cible));
  return ligne;
}

function blocTitres(contexte, p) {
  const section = el('section', { classe: 'bloc', test: 'titres' }, el('h2', { classe: 'rubrique', texte: t('feuille.titres') }));
  if (p.titres.length === 0) {
    section.append(el('p', { classe: 'legende', texte: t('feuille.titres_vide') }));
  } else {
    section.append(el('ul', { classe: 'puces' }, ...p.titres.map((titre, index) => el('li', { classe: 'puce' },
      titre,
      action(boutonRetirer('retirer', '×', titre), contexte, p.id, (q) => retirerDeListe(q, 'titres', index))))));
  }
  section.append(ajoutTexte(contexte, p.id, 'titre-champ', 'titre-ajouter', t('feuille.titre_ajouter'), ajouterTitre));
  return section;
}

function blocHistoire(contexte, p) {
  const histoire = el('textarea', { id: 'histoire', test: 'histoire', rows: '4' });
  histoire.value = p.histoire;
  histoire.addEventListener('change', () => {
    const texte = histoire.value;
    changer(contexte, p.id, (q) => ({ ...q, histoire: texte }), { rendre: false });
  });
  return el('section', { classe: 'bloc' },
    el('h2', { classe: 'rubrique' }, el('label', { for: 'histoire', texte: t('feuille.histoire') })),
    el('p', { classe: 'legende', texte: t('feuille.histoire_aide') }),
    histoire);
}

function piedFiche(contexte, p) {
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
    await supprimerPersonnage(p.id).catch(() => {});
    contexte.naviguer('#/');
  });
  return el('div', { classe: 'actions pied-fiche' }, lienRetour(), supprimer);
}

function rubriqueStatistiques(contexte, p, base, deplie) {
  return [
    ...blocEndurance(contexte, p, base, deplie),
    el('h2', { classe: 'rubrique', texte: t('feuille.competences') }),
    el('ul', { classe: 'stats' }, ...[...COMPETENCES, 'defense'].map((cible) => ligneStat(contexte, p, base, deplie, cible))),
    blocTitres(contexte, p),
    blocHistoire(contexte, p),
    piedFiche(contexte, p),
  ];
}

// ---- La fiche : Possessions ----------------------------------------------------------------------------

function blocBourse(contexte, p) {
  const montant = el('input', {
    type: 'number', inputmode: 'numeric', min: '1', test: 'montant', placeholder: t('feuille.montant'), 'aria-label': t('feuille.montant'),
  });
  const message = el('p', { classe: 'message echec', test: 'bourse-message', role: 'status' });
  const operation = (sens) => (q) => {
    const issue = operationBourse(q, sens, montant.value);
    if (issue.issue === 'insuffisante') message.textContent = t('feuille.bourse_insuffisante', { n: q.bourse });
    return issue.issue === 'ok' ? issue.personnage : null;
  };
  const section = el('section', { classe: 'cadre bourse', test: 'bourse' },
    el('h2', { classe: 'petit-titre', texte: t('feuille.bourse') }),
    compteur('gros', [String(p.bourse), el('span', { classe: 'sur', texte: ` ${t('feuille.chardes')}` })],
      { test: 'bourse-moins', libelle: t('feuille.bourse_moins') },
      { test: 'bourse-plus', libelle: t('feuille.bourse_plus') }),
    el('div', { classe: 'ajout' },
      montant,
      action(el('button', { classe: 'bouton', type: 'button', test: 'gagner', texte: t('feuille.gagner') }), contexte, p.id, operation('gagner')),
      action(el('button', { classe: 'bouton bouton-second', type: 'button', test: 'depenser', texte: t('feuille.depenser') }), contexte, p.id, operation('depenser'))),
    message);
  action(section.querySelector('[data-test=bourse-moins]'), contexte, p.id, (q) => changerBourse(q, -1));
  action(section.querySelector('[data-test=bourse-plus]'), contexte, p.id, (q) => changerBourse(q, 1));
  return section;
}

// Lot v0.4 — l'éditeur du bonus de l'objet `index` : la cible, la valeur, « Enregistrer », puis « Fermer ».
// Écrit, l'adresse revient aux Possessions ; refusé, rien n'est enregistré et l'éditeur reste ouvert.
function editeurObjet(contexte, p, base, index) {
  const { bonus } = p.possessions[index];
  const cible = choixCible('objet-cible', bonus === null ? '' : bonus.cible);
  const valeur = champValeurObjet('objet-valeur', bonus === null ? 1 : bonus.valeur);
  const enregistrer = el('button', { classe: 'bouton', type: 'button', test: 'objet-enregistrer', texte: t('feuille.enregistrer') });
  action(enregistrer, contexte, p.id, (q) => changerBonusObjet(q, index, cible.value, valeur.value), { ancre: base });
  return el('div', { classe: 'editeur editeur-objet', test: 'editeur-objet' },
    el('div', { classe: 'ajout-objet' }, cible, valeur, enregistrer),
    el('a', { classe: 'lien', href: base, texte: t('feuille.fermer') }));
}

// Lot v0.4 — l'ajout d'une possession : le texte, la cible et la valeur du bonus, « Ajouter » (ou Entrée dans le
// champ texte) ; tout est désactivé à 12 possessions.
function ajoutPossession(contexte, p, plein) {
  const champ = el('input', {
    type: 'text', test: 'possession-champ', placeholder: t('feuille.possession_ajouter'), 'aria-label': t('feuille.possession_ajouter'),
  });
  const cible = choixCible('possession-cible', '');
  const valeur = champValeurObjet('possession-valeur', 1);
  const bouton = el('button', { classe: 'bouton', type: 'button', test: 'possession-ajouter', texte: t('feuille.ajouter') });
  if (plein) for (const element of [champ, cible, valeur, bouton]) element.setAttribute('disabled', '');
  const ajout = (declencheur) => changer(contexte, p.id, (q) => ajouterPossession(q, champ.value, cible.value, valeur.value), { declencheur });
  bouton.addEventListener('click', () => ajout(bouton));
  champ.addEventListener('keydown', (evenement) => {
    if (evenement.key !== 'Enter') return;
    evenement.preventDefault();
    ajout(champ);
  });
  return el('div', { classe: 'ajout-possession' }, champ, cible, valeur, bouton);
}

// Lot v0.4 — `ouvert` : l'index de l'objet dont l'éditeur est ouvert (null : aucun, ou un index hors de la liste).
// Lot v0.8 — `lieuOuvert` : le quatrième morceau de l'adresse (s<n> ouvre le lieu de stockage n), ou null.
function rubriquePossessions(contexte, p, base, ouvert, lieuOuvert) {
  const plein = p.possessions.length >= MAX_POSSESSIONS;
  const enEdition = Number.isInteger(ouvert) && ouvert < p.possessions.length ? ouvert : null;
  const noeuds = [
    blocBourse(contexte, p),
    el('h2', { classe: 'rubrique' }, t('feuille.transportees'),
      el('span', { classe: 'compte', test: 'compte-possessions', texte: ` ${p.possessions.length} / ${MAX_POSSESSIONS}` })),
  ];
  if (p.possessions.length === 0) {
    noeuds.push(el('p', { classe: 'legende', texte: t('feuille.possessions_vide') }));
  } else {
    noeuds.push(el('ol', { classe: 'possessions', test: 'possessions' }, ...p.possessions.map((objet, index) => {
      const nom = el('span', { classe: 'objet', texte: objet.texte });
      if (objet.bonus !== null) {
        nom.append(' ', el('span', {
          classe: classePuceObjet(objet.bonus.valeur), test: 'bonus-objet', texte: `${nomCible(objet.bonus.cible)} ${signe(objet.bonus.valeur)}`,
        }));
      }
      const ouverte = index === enEdition;
      const ligne = el('li', ouverte ? { classe: 'ouverte' } : {},
        nom,
        el('a', { classe: 'lien', test: 'objet-bonus', href: ouverte ? base : `${base}/${index}`, texte: t('feuille.objet_bonus') }),
        action(boutonRetirer('lien', t('feuille.retirer'), objet.texte), contexte, p.id, (q) => retirerDeListe(q, 'possessions', index),
          { ancre: enEdition === null ? null : base }));
      if (ouverte) ligne.append(editeurObjet(contexte, p, base, index));
      return ligne;
    })));
  }
  noeuds.push(ajoutPossession(contexte, p, plein));
  if (plein) noeuds.push(el('p', { classe: 'legende', test: 'plein', texte: t('feuille.possessions_plein') }));
  // Lot v0.8 — les possessions stockées.
  noeuds.push(blocLieux(contexte, p, base, 'stockees', indexOuvert(lieuOuvert, 's', p.stockees)));
  return noeuds;
}

// ---- La fiche : Cultes ---------------------------------------------------------------------------------

// Les trois listes des cultes : leur titre, leur légende vide, leurs champs (nom, libellé, nombre ?).
const CULTES = [
  {
    liste: 'benedictions',
    titre: () => t('feuille.benedictions'),
    vide: () => t('feuille.benedictions_vide'),
    champs: [['origine', () => t('feuille.origine'), false], ['consequences', () => t('feuille.consequences'), false]],
  },
  {
    liste: 'maledictions',
    titre: () => t('feuille.maledictions'),
    vide: () => t('feuille.maledictions_vide'),
    champs: [['origine', () => t('feuille.origine'), false], ['consequences', () => t('feuille.consequences'), false]],
  },
  {
    liste: 'resurrections',
    titre: () => t('feuille.resurrections'),
    vide: () => t('feuille.resurrections_vide'),
    champs: [
      ['origine', () => t('feuille.origine'), false],
      ['lieu', () => t('feuille.lieu'), false],
      ['livre', () => t('perso.livre'), true],
      ['section', () => t('perso.section'), true],
    ],
  },
];

function blocCulte(contexte, p, culte) {
  const section = el('section', { classe: 'bloc', test: culte.liste }, el('h2', { classe: 'rubrique', texte: culte.titre() }));
  const entrees = p[culte.liste];
  if (entrees.length === 0) {
    section.append(el('p', { classe: 'legende', texte: culte.vide() }));
  } else {
    section.append(el('ul', { classe: 'entrees' }, ...entrees.map((entree, index) => {
      const nom = entree.origine === '' ? '—' : entree.origine;
      const details = culte.champs.slice(1)
        .filter(([cle]) => entree[cle] !== '' && entree[cle] !== null)
        .map(([cle, libelle]) => el('p', {}, el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: libelle() }) }), ` ${entree[cle]}`));
      return el('li', { classe: 'cadre entree' },
        el('p', { classe: 'nom', texte: nom }),
        ...details,
        action(boutonRetirer('lien', t('feuille.retirer'), nom), contexte, p.id, (q) => retirerDeListe(q, culte.liste, index)));
    })));
  }
  const champs = culte.champs.map(([cle, libelle, nombre]) => [cle, el('input', nombre
    ? { type: 'number', inputmode: 'numeric', min: '1', placeholder: libelle(), 'aria-label': libelle() }
    : { type: 'text', placeholder: libelle(), 'aria-label': libelle() })]);
  const ajouter = el('button', { classe: 'bouton', type: 'button', texte: t('feuille.ajouter') });
  action(ajouter, contexte, p.id, (q) => ajouterEntree(q, culte.liste, Object.fromEntries(champs.map(([cle, champ]) => [cle, champ.value]))));
  section.append(el('details', { classe: 'ajout-entree' },
    el('summary', { classe: 'lien', texte: t('feuille.ajouter') }),
    el('div', { classe: 'champs-entree' }, ...champs.map(([, champ]) => champ), ajouter)));
  return section;
}

const rubriqueCultes = (contexte, p) => CULTES.map((culte) => blocCulte(contexte, p, culte));

// ---- Lot v0.7 — les cases de section : ce que partagent la rubrique Codes et la section en cours ----------

// Le livre des listes de la rubrique Codes et du choix des codes d'une quête, quel que soit le livre en cours.
const LIVRE_LISTES = 1;

// Le libellé d'une ligne de cases : une table code → texte ; une ligne sans libellé n'en montre pas.
const LIBELLE_LIGNE = {
  chez_vous: () => t('cases.chez_vous'),
};
const libelleLigne = (ligne) => (Object.hasOwn(LIBELLE_LIGNE, ligne.libelle)
  ? [el('span', { classe: 'ligne-libelle', texte: LIBELLE_LIGNE[ligne.libelle]() })]
  : []);

// Les cases de la ligne `ligne` du livre `livre` : une case par rang, cochée si le rang est coché ; au changement, la
// case seule se coche ou se décoche, le focus revenant à la case.
function casesLigne(contexte, p, livre, ligne) {
  const coches = rangsCoches(p, livre, ligne.section, ligne.libelle, ligne.cases);
  return el('span', { classe: 'cases' }, ...Array.from({ length: ligne.cases }, (_, rang) => {
    const caseRang = el('input', {
      type: 'checkbox', classe: 'case', test: 'case', 'aria-label': t('cases.case', { section: ligne.section, n: rang + 1 }),
    });
    caseRang.checked = coches.includes(rang);
    caseRang.addEventListener('change', () => {
      const cocher = caseRang.checked;
      changer(contexte, p.id, (q) => cocherCase(q, livre, ligne.section, ligne.libelle, ligne.cases, rang, cocher), { declencheur: caseRang });
    });
    return el('label', { classe: 'zone-case' }, caseRang);
  }));
}

// ---- Lot v0.6 — le journal : ce que partagent Aventure et Combats ---------------------------------------

// « livre 1, section 112 ».
const lieu = (livre, section) => t('journal.lieu', { livre, section });

// L'index ouvert par l'adresse : `ouvert` s'écrit exactement `lettre` suivie d'un entier sans zéro de tête, et cet
// entier est un index de `liste` ; sinon null. Lot v0.8 — aussi les lettres i, d (Biens) et s (Possessions).
function indexOuvert(ouvert, lettre, liste) {
  if (typeof ouvert !== 'string' || !/^[qaids](0|[1-9][0-9]*)$/.test(ouvert) || ouvert[0] !== lettre) return null;
  const n = Number(ouvert.slice(1));
  return n < liste.length ? n : null;
}

// Un champ nombre du journal, sans placeholder.
const champSection = (test, libelle, min, valeur = '') => el('input', {
  type: 'number', inputmode: 'numeric', min: String(min), test, 'aria-label': libelle, value: String(valeur),
});

// La jauge d'une Endurance : arrondi(actuelle / max × 100) %, 0 si max vaut 0.
function jauge({ max, actuelle }) {
  const barre = el('span');
  barre.style.width = `${max === 0 ? 0 : Math.round((actuelle / max) * 100)}%`;
  return el('div', { classe: 'jauge' }, barre);
}

// Le bouton à deux temps : un premier toucher remplace son texte par « Confirmer ? » pendant DELAI_CONFIRMATION, un
// second dans ce délai applique `transformer` (options : celles de changer()). Le motif de « Supprimer le personnage ».
function boutonDeuxTemps(contexte, id, { classe, test, texte, nom }, transformer, options = {}) {
  const bouton = el('button', { classe, type: 'button', test, 'aria-label': t('feuille.retirer_nom', { nom }), texte });
  let arme = false;
  let minuterie = null;
  bouton.addEventListener('click', () => {
    if (!arme) {
      arme = true;
      bouton.textContent = t('journal.confirmer');
      minuterie = setTimeout(() => {
        arme = false;
        bouton.textContent = texte;
      }, DELAI_CONFIRMATION);
      return;
    }
    clearTimeout(minuterie);
    arme = false;
    bouton.textContent = texte;
    changer(contexte, id, transformer, options);
  });
  return bouton;
}

// La pastille d'une section (du chemin ou d'une quête) : toucher y mène. L'abréviation du livre seulement s'il
// diffère du livre en cours.
function pastille(contexte, p, { livre, section }, test) {
  const bouton = el('button', { classe: 'puce pas', type: 'button', test, 'aria-label': t('journal.aller_a', { lieu: lieu(livre, section) }) });
  if (livre !== p.section_en_cours.livre) bouton.append(el('span', { classe: 'pas-livre', texte: t('journal.livre_abr', { livre }) }));
  bouton.append(String(section));
  return action(bouton, contexte, p.id, (q) => allerSection(q, livre, section));
}

// ---- Lot v0.6 — la fiche : Aventure --------------------------------------------------------------------

const PAS_VISIBLES = 8;

// La section en cours, « Aller », le chemin parcouru (les 8 dernières sections, la plus récente d'abord ; les
// suivantes dans « Tout le chemin »).
function blocSectionCours(contexte, p) {
  const { livre, section } = p.section_en_cours;
  const champLivre = champSection('aller-livre', t('perso.livre'), 1, livre);
  const champNumero = champSection('aller-section', t('journal.aller_section'), 1);
  const erreur = el('p', { classe: 'erreur', test: 'aller-erreur', role: 'alert' });
  const formulaire = el('form', { classe: 'aller', novalidate: '' },
    el('label', { classe: 'champ-livre' }, el('span', { classe: 'legende', texte: t('perso.livre') }), champLivre),
    el('label', { classe: 'champ-section' }, el('span', { classe: 'legende', texte: t('journal.aller_section') }), champNumero),
    el('button', { classe: 'bouton', type: 'submit', test: 'aller', texte: t('journal.aller') }));
  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    erreur.textContent = '';
    const livreSaisi = champLivre.value;
    const sectionSaisie = champNumero.value;
    const lus = [entierSaisi(livreSaisi), entierSaisi(sectionSaisie)];
    if (lus.some((n) => n === null || n < 1)) {
      erreur.textContent = t('journal.aller_invalide');
      return;
    }
    changer(contexte, p.id, (q) => allerSection(q, livreSaisi, sectionSaisie), { declencheur: champNumero });
  });

  const chemin = el('div', { classe: 'chemin', test: 'chemin' }, el('p', { classe: 'petit-titre', texte: t('journal.chemin') }));
  const pas = [...p.historique].reverse();
  if (pas.length === 0) {
    chemin.append(el('p', { classe: 'legende', texte: t('journal.chemin_vide') }));
  } else {
    const liste = (entrees) => el('ol', { classe: 'pas-liste' }, ...entrees.map((e) => el('li', {}, pastille(contexte, p, e, 'pas'))));
    chemin.append(liste(pas.slice(0, PAS_VISIBLES)));
    if (pas.length > PAS_VISIBLES) {
      chemin.append(el('details', { classe: 'chemin-complet' },
        el('summary', { classe: 'lien', texte: t('journal.chemin_tout', { n: pas.length }) }),
        liste(pas.slice(PAS_VISIBLES))));
    }
  }
  // Lot v0.7 — les cases de la section en cours, sous son numéro, s'il y en a (livre = le livre en cours).
  const lignes = section === null ? [] : lignesDeSection(livre, section);
  const casesCours = lignes.length === 0 ? [] : [el('div', { classe: 'cases-cours', test: 'cases-cours' },
    el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('cases.cours') }) }),
    ...lignes.map((ligne) => el('span', { classe: 'ligne-cases' }, ...libelleLigne(ligne), casesLigne(contexte, p, livre, ligne))))];
  return el('section', { classe: 'cadre section-cours', test: 'section-cours' },
    el('h2', { classe: 'petit-titre', texte: t('journal.section_cours') }),
    el('div', { classe: 'cours-haut' },
      el('p', { classe: 'numero-cours' },
        el('span', { classe: 'livre-cours', texte: `${t('perso.livre')} ${livre}` }),
        el('span', { classe: 'numero', test: 'section-numero', texte: section === null ? '—' : String(section) })),
      ...casesCours,
      formulaire),
    erreur,
    chemin);
}

// L'éditeur d'une quête ouverte : le titre, les personnages, les sections importantes, « Fermer » et « Retirer ».
function editeurQuete(contexte, p, base, index) {
  const quete = p.quetes[index];
  const titre = el('input', { type: 'text', test: 'quete-titre', 'aria-label': t('journal.titre') });
  titre.value = quete.titre;
  titre.addEventListener('change', () => {
    const texte = titre.value;
    changer(contexte, p.id, (q) => modifierQuete(q, index, { titre: texte }));
  });
  const personnages = el('input', {
    type: 'text', test: 'quete-personnages', placeholder: t('journal.personnages'), 'aria-label': t('journal.personnages'),
  });
  personnages.value = quete.personnages;
  personnages.addEventListener('change', () => {
    const texte = personnages.value;
    changer(contexte, p.id, (q) => modifierQuete(q, index, { personnages: texte }), { rendre: false });
  });
  const sections = quete.sections.length === 0
    ? el('p', { classe: 'legende', texte: t('journal.sections_vide') })
    : el('ul', { classe: 'puces' }, ...quete.sections.map((e, rang) => el('li', { classe: 'puce' },
      lieu(e.livre, e.section),
      action(boutonRetirer('retirer', '×', lieu(e.livre, e.section)), contexte, p.id, (q) => retirerSectionQuete(q, index, rang)))));
  const livre = champSection('quete-section-livre', t('perso.livre'), 1, p.section_en_cours.livre);
  const section = champSection('quete-section-section', t('perso.section'), 1);
  const ajouter = el('button', { classe: 'bouton bouton-second', type: 'button', test: 'quete-section-ajouter', texte: t('feuille.ajouter') });
  action(ajouter, contexte, p.id, (q) => ajouterSectionQuete(q, index, livre.value, section.value));
  // Lot v0.7 — les codes liés : retirés d'un toucher ; ajoutés depuis la liste du livret, sans ceux déjà liés.
  const codes = quete.codes.length === 0
    ? el('p', { classe: 'legende', test: 'quete-codes-vide', texte: t('journal.codes_vide') })
    : el('ul', { classe: 'puces', test: 'quete-codes' }, ...quete.codes.map((code, rang) => el('li', { classe: 'puce' },
      code,
      action(boutonRetirer('retirer', '×', code), contexte, p.id, (q) => retirerCodeQuete(q, index, rang)))));
  const choixCode = el('select', { test: 'quete-code-choix', 'aria-label': t('journal.code_choisir') },
    el('option', { value: '', texte: t('journal.code_choisir') }),
    ...LIVRETS[LIVRE_LISTES].codes.filter((code) => !quete.codes.includes(code)).map((code) => el('option', { value: code, texte: code })));
  const ajouterCode = el('button', { classe: 'bouton bouton-second', type: 'button', test: 'quete-code-ajouter', texte: t('feuille.ajouter') });
  action(ajouterCode, contexte, p.id, (q) => ajouterCodeQuete(q, index, choixCode.value));
  return el('div', { classe: 'editeur editeur-quete', test: 'editeur-quete' },
    el('label', { classe: 'petit-titre', texte: t('journal.titre') }, titre),
    el('label', { classe: 'petit-titre', texte: t('journal.personnages') }, personnages),
    el('p', { classe: 'petit-titre', texte: t('journal.sections') }),
    sections,
    el('div', { classe: 'ajout-section' },
      el('label', {}, el('span', { classe: 'legende', texte: t('perso.livre') }), livre),
      el('label', {}, el('span', { classe: 'legende', texte: t('perso.section') }), section),
      ajouter),
    el('p', { classe: 'petit-titre', texte: t('journal.codes') }),
    codes,
    el('div', { classe: 'ajout-code' }, choixCode, ajouterCode),
    el('div', { classe: 'actions' },
      el('a', { classe: 'lien', href: base, texte: t('feuille.fermer') }),
      boutonDeuxTemps(contexte, p.id, { classe: 'lien lien-danger', test: 'quete-retirer', texte: t('journal.quete_retirer'), nom: quete.titre },
        (q) => retirerDeListe(q, 'quetes', index), { ancre: base })));
}

// La carte d'une quête : son titre et la case « Terminée » ; fermée, ses personnages, ses sections et « Modifier » ;
// ouverte, son éditeur.
function carteQuete(contexte, p, base, index, ouverte) {
  const quete = p.quetes[index];
  const caseTerminee = el('input', { type: 'checkbox', classe: 'case', test: 'quete-terminee' });
  caseTerminee.checked = quete.terminee;
  caseTerminee.addEventListener('change', () => {
    const terminee = caseTerminee.checked;
    changer(contexte, p.id, (q) => modifierQuete(q, index, { terminee }));
  });
  const carte = el('li', { classe: quete.terminee ? 'cadre quete finie' : 'cadre quete', test: 'quete' },
    el('div', { classe: 'quete-entete' },
      el('p', { classe: 'nom', texte: quete.titre }),
      el('label', { classe: 'terminee' }, caseTerminee, el('span', { texte: t('journal.terminee') }))));
  if (ouverte) {
    carte.append(editeurQuete(contexte, p, base, index));
    return carte;
  }
  if (quete.personnages !== '') {
    carte.append(el('p', {}, el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('journal.personnages') }) }), ` ${quete.personnages}`));
  }
  if (quete.sections.length > 0) {
    carte.append(el('div', { classe: 'quete-sections' },
      el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('journal.sections') }) }),
      ...quete.sections.map((e) => pastille(contexte, p, e, 'quete-pas'))));
  }
  // Lot v0.7 — les codes liés, en pastilles : « tenu » si le personnage a le code.
  if (quete.codes.length > 0) {
    carte.append(el('div', { classe: 'quete-codes' },
      el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('journal.codes') }) }),
      ...quete.codes.map((code) => el('span', { classe: p.codes.includes(code) ? 'puce code-lie tenu' : 'puce code-lie', test: 'quete-code', texte: code }))));
  }
  carte.append(el('a', { classe: 'lien', test: 'quete-modifier', href: `${base}/q${index}`, texte: t('feuille.modifier') }));
  return carte;
}

// Les quêtes : celles en cours, l'ajout, puis les terminées (dépliées si la quête ouverte en est une).
function blocQuetes(contexte, p, base, ouverte) {
  const indexes = p.quetes.map((_, index) => index);
  const enCours = indexes.filter((index) => !p.quetes[index].terminee);
  const finies = indexes.filter((index) => p.quetes[index].terminee);
  const carte = (index) => carteQuete(contexte, p, base, index, index === ouverte);
  const titre = el('h2', { classe: 'rubrique' }, t('journal.quetes'));
  if (enCours.length > 0) titre.append(el('span', { classe: 'compte', texte: ` ${t('journal.en_cours', { n: enCours.length })}` }));
  const section = el('section', { classe: 'bloc', test: 'quetes' }, titre);
  if (enCours.length === 0) section.append(el('p', { classe: 'legende', texte: t('journal.quetes_vide') }));
  section.append(el('ul', { classe: 'entrees' }, ...enCours.map(carte)),
    ajoutTexte(contexte, p.id, 'quete-champ', 'quete-ajouter', t('journal.quete_ajouter'), ajouterQuete));
  if (finies.length > 0) {
    const details = el('details', { classe: 'quetes-finies', test: 'quetes-finies' },
      el('summary', { classe: 'lien', texte: t('journal.quetes_finies', { n: finies.length }) }),
      el('ul', { classe: 'entrees' }, ...finies.map(carte)));
    if (finies.includes(ouverte)) details.setAttribute('open', '');
    section.append(details);
  }
  return section;
}

// La date d'une note (« 25 oct. », « Oct 25 »), dans la langue de la page ; null si elle est illisible.
function dateNote(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(document.documentElement.lang, { day: 'numeric', month: 'short' }).format(date);
}

// Les notes : l'ajout, puis les notes, la plus récente d'abord.
function blocNotes(contexte, p) {
  const champ = el('textarea', { test: 'note-champ', rows: '2', placeholder: t('journal.note_ajouter'), 'aria-label': t('journal.note_ajouter') });
  const ajouter = el('button', { classe: 'bouton', type: 'button', test: 'note-ajouter', texte: t('feuille.ajouter') });
  action(ajouter, contexte, p.id, (q) => ajouterNote(q, champ.value));
  const section = el('section', { classe: 'bloc', test: 'notes' },
    el('h2', { classe: 'rubrique', texte: t('journal.notes') }),
    el('div', { classe: 'ajout-note' }, champ, ajouter));
  if (p.notes.length === 0) {
    section.append(el('p', { classe: 'legende', texte: t('journal.notes_vide') }));
    return section;
  }
  const indexes = p.notes.map((_, index) => index).reverse();
  section.append(el('ul', { classe: 'notes' }, ...indexes.map((index) => {
    const note = p.notes[index];
    const pied = [dateNote(note.ecrite_le), note.section === null ? null : lieu(note.livre, note.section)].filter((x) => x !== null);
    return el('li', { classe: 'note', test: 'note' },
      el('p', { classe: 'note-texte', texte: note.texte }),
      el('p', { classe: 'note-pied' },
        el('span', { classe: 'legende', texte: pied.join(' · ') }),
        boutonDeuxTemps(contexte, p.id, { classe: 'lien', test: 'note-retirer', texte: t('feuille.retirer'), nom: Array.from(note.texte).slice(0, 30).join('') },
          (q) => retirerDeListe(q, 'notes', index))));
  })));
  return section;
}

// `ouvert` : le quatrième morceau de l'adresse (q<n> ouvre la quête n), ou null.
function rubriqueAventure(contexte, p, base, ouvert) {
  return [blocSectionCours(contexte, p), blocQuetes(contexte, p, base, indexOuvert(ouvert, 'q', p.quetes)), blocNotes(contexte, p)];
}

// ---- Lot v0.6 — la fiche : Combats ---------------------------------------------------------------------

// Les chiffres d'un combattant : Combat, Défense, puis l'Endurance à − / +.
const chiffres = (combat, valeurDefense, endurance) => el('div', { classe: 'chiffres' },
  el('div', { classe: 'chiffre' }, el('span', { classe: 'legende', texte: t('comp.combat') }), combat),
  el('div', { classe: 'chiffre' }, el('span', { classe: 'legende', texte: t('feuille.defense') }), valeurDefense),
  el('div', { classe: 'chiffre endu' }, el('span', { classe: 'legende', texte: t('feuille.endurance') }), endurance));

const compteurEndurance = ({ max, actuelle }, moins, plus) => compteur('moyen', [String(actuelle), el('span', { classe: 'sur', texte: ` / ${max}` })], moins, plus);

// Le personnage tel que la feuille le donne : le total de Combat, la Défense, son Endurance.
function blocVous(contexte, p) {
  const section = el('section', { classe: 'cadre combattant vous', test: 'vous' },
    el('h2', { classe: 'petit-titre', texte: t('journal.vous') }),
    chiffres(
      el('span', { classe: 'moyen', test: 'vous-combat', texte: chiffre(totalCompetence(p, 'combat')) }),
      el('span', { classe: 'moyen', test: 'vous-defense', texte: chiffre(defense(p)) }),
      compteurEndurance(p.endurance,
        { test: 'vous-moins', libelle: t('feuille.endurance_moins') },
        { test: 'vous-plus', libelle: t('feuille.endurance_plus') })),
    jauge(p.endurance));
  action(section.querySelector('[data-test=vous-moins]'), contexte, p.id, (q) => changerEndurance(q, -1));
  action(section.querySelector('[data-test=vous-plus]'), contexte, p.id, (q) => changerEndurance(q, 1));
  return section;
}

// Les champs d'un adversaire, préfixe « nouveau » ou « adv » : le nom, puis le Combat, la Défense et l'Endurance.
const CHAMPS_ADVERSAIRE = [['combat', () => t('comp.combat')], ['defense', () => t('feuille.defense')], ['endurance', () => t('feuille.endurance')]];

function champsAdversaire(prefixe, valeurs = { nom: '', combat: '', defense: '', endurance: '' }) {
  const nom = el('input', { type: 'text', test: `${prefixe}-nom`, placeholder: t('journal.adv_nom'), 'aria-label': t('journal.adv_nom') });
  nom.value = valeurs.nom;
  const nombres = CHAMPS_ADVERSAIRE.map(([champ, libelle]) => [champ, libelle, el('input', {
    type: 'number', inputmode: 'numeric', min: '0', test: `${prefixe}-${champ}`, 'aria-label': libelle(), value: String(valeurs[champ]),
  })]);
  return {
    bloc: el('div', { classe: 'ajout-adversaire' }, nom,
      ...nombres.map(([, libelle, champ]) => el('label', {}, el('span', { classe: 'legende', texte: libelle() }), champ))),
    saisie: () => ({ nom: nom.value, ...Object.fromEntries(nombres.map(([champ, , element]) => [champ, element.value])) }),
  };
}

// La carte d'un adversaire : son nom et son lieu, ses chiffres, « Fin du combat » et « Modifier » ; ouverte, son éditeur.
function carteAdversaire(contexte, p, base, index, ouverte) {
  const adversaire = p.combats[index];
  const entete = el('div', { classe: 'adv-entete' }, el('p', { classe: 'nom', texte: adversaire.nom }));
  if (adversaire.section !== null) entete.append(el('span', { classe: 'legende', texte: lieu(adversaire.livre, adversaire.section) }));
  const fin = el('button', { classe: 'bouton bouton-second', type: 'button', test: 'combat-fin', texte: t('journal.fin_combat') });
  action(fin, contexte, p.id, (q) => finirCombat(q, index), { ancre: base });
  const carte = el('li', { classe: 'cadre combattant adversaire', test: 'adversaire' },
    entete,
    chiffres(
      el('span', { classe: 'moyen', texte: String(adversaire.combat) }),
      el('span', { classe: 'moyen', texte: String(adversaire.defense) }),
      compteurEndurance(adversaire.endurance,
        { test: 'adv-moins', libelle: t('journal.adv_moins', { nom: adversaire.nom }) },
        { test: 'adv-plus', libelle: t('journal.adv_plus', { nom: adversaire.nom }) })),
    jauge(adversaire.endurance),
    el('div', { classe: 'actions' },
      fin,
      el('a', { classe: 'lien', test: 'adv-modifier', href: ouverte ? base : `${base}/a${index}`, texte: ouverte ? t('feuille.fermer') : t('feuille.modifier') })));
  action(carte.querySelector('[data-test=adv-moins]'), contexte, p.id, (q) => changerEnduranceAdversaire(q, index, -1));
  action(carte.querySelector('[data-test=adv-plus]'), contexte, p.id, (q) => changerEnduranceAdversaire(q, index, 1));
  if (!ouverte) return carte;
  // Écrit, l'adresse revient aux Combats ; refusé, rien n'est enregistré et l'éditeur reste ouvert.
  const champs = champsAdversaire('adv', { ...adversaire, endurance: adversaire.endurance.max });
  const enregistrer = el('button', { classe: 'bouton', type: 'button', test: 'adv-enregistrer', texte: t('feuille.enregistrer') });
  action(enregistrer, contexte, p.id, (q) => modifierAdversaire(q, index, champs.saisie()), { ancre: base });
  carte.append(el('div', { classe: 'editeur', test: 'editeur-adversaire' },
    champs.bloc,
    el('div', { classe: 'actions' },
      enregistrer,
      boutonDeuxTemps(contexte, p.id, { classe: 'lien lien-danger', test: 'adv-retirer', texte: t('journal.adv_retirer'), nom: adversaire.nom },
        (q) => retirerDeListe(q, 'combats', index), { ancre: base }))));
  return carte;
}

// « Nouvel adversaire » : déplié quand aucun combat n'est en cours ; une saisie invalide le dit, rien n'est écrit.
function ajoutAdversaire(contexte, p, ouvert) {
  const champs = champsAdversaire('nouveau');
  const erreur = el('p', { classe: 'erreur', role: 'alert' });
  const ajouter = el('button', { classe: 'bouton', type: 'button', test: 'nouveau-ajouter', texte: t('feuille.ajouter') });
  action(ajouter, contexte, p.id, (q) => {
    const nouveau = ajouterAdversaire(q, champs.saisie());
    erreur.textContent = nouveau === null ? t('journal.adv_invalide') : '';
    return nouveau;
  });
  const details = el('details', { classe: 'ajout-entree', test: 'nouvel-adversaire' },
    el('summary', { classe: 'lien', texte: t('journal.adv_nouveau') }),
    el('div', { classe: 'champs-entree' }, champs.bloc, erreur, ajouter));
  if (ouvert) details.setAttribute('open', '');
  return details;
}

// Les combats passés, le plus récent d'abord : retirés d'un toucher, sans confirmation.
function blocCombatsPasses(contexte, p, passes) {
  return el('details', { classe: 'combats-passes', test: 'combats-passes' },
    el('summary', { classe: 'lien', texte: t('journal.combats_passes', { n: passes.length }) }),
    el('ul', { classe: 'passes' }, ...[...passes].reverse().map((index) => {
      const combat = p.combats[index];
      const { max, actuelle } = combat.endurance;
      const ligne = t('journal.passe_chiffres', { combat: combat.combat, defense: combat.defense, actuelle, max });
      return el('li', { test: 'combat-passe' },
        el('span', { classe: 'objet' },
          el('span', { classe: 'nom-passe', texte: combat.nom }),
          el('span', { classe: 'legende', texte: combat.section === null ? ligne : `${ligne} · ${lieu(combat.livre, combat.section)}` })),
        action(boutonRetirer('lien', t('feuille.retirer'), combat.nom), contexte, p.id, (q) => retirerDeListe(q, 'combats', index)));
    })));
}

// `ouvert` : le quatrième morceau de l'adresse (a<n> ouvre l'adversaire n), ou null.
function rubriqueCombats(contexte, p, base, ouvert) {
  const ouverte = indexOuvert(ouvert, 'a', p.combats);
  const indexes = p.combats.map((_, index) => index);
  const enCours = indexes.filter((index) => !p.combats[index].termine);
  const passes = indexes.filter((index) => p.combats[index].termine);
  const noeuds = [blocVous(contexte, p), el('h2', { classe: 'rubrique', texte: t('journal.adversaires') })];
  if (enCours.length === 0) noeuds.push(el('p', { classe: 'legende', texte: t('journal.combats_vide') }));
  noeuds.push(
    el('ul', { classe: 'entrees' }, ...enCours.map((index) => carteAdversaire(contexte, p, base, index, index === ouverte))),
    ajoutAdversaire(contexte, p, enCours.length === 0));
  if (passes.length > 0) noeuds.push(blocCombatsPasses(contexte, p, passes));
  return noeuds;
}

// ---- Lot v0.7 — la fiche : Codes ------------------------------------------------------------------------

// Les codes du livret à cocher, puis ses cases de section, ligne par ligne (toujours celles du livre des listes).
function rubriqueCodes(contexte, p) {
  const { codes, cases } = LIVRETS[LIVRE_LISTES];
  const tenus = codes.filter((code) => p.codes.includes(code)).length;
  const cochees = cases.reduce((n, ligne) => n + rangsCoches(p, LIVRE_LISTES, ligne.section, ligne.libelle, ligne.cases).length, 0);
  const totalCases = cases.reduce((n, ligne) => n + ligne.cases, 0);
  const { livre, section } = p.section_en_cours;
  const blocCodes = el('section', { classe: 'bloc', test: 'bloc-codes' },
    el('h2', { classe: 'rubrique' }, t('codes.titre'),
      el('span', { classe: 'compte', test: 'codes-compte', texte: ` ${t('codes.compte', { n: tenus, total: codes.length })}` })),
    el('ul', { classe: 'grille-codes', test: 'codes' }, ...codes.map((code) => {
      const tenu = p.codes.includes(code);
      const caseCode = el('input', { type: 'checkbox', classe: 'case', test: 'code' });
      caseCode.checked = tenu;
      caseCode.addEventListener('change', () => changer(contexte, p.id, (q) => basculerCode(q, code), { declencheur: caseCode }));
      return el('li', {}, el('label', { classe: tenu ? 'code tenu' : 'code' }, caseCode, el('span', { texte: code })));
    })));
  const blocCases = el('section', { classe: 'bloc', test: 'bloc-cases' },
    el('h2', { classe: 'rubrique' }, t('cases.titre'),
      el('span', { classe: 'compte', test: 'cases-compte', texte: ` ${t('cases.compte', { n: cochees, total: totalCases })}` })),
    el('ul', { classe: 'grille-cases', test: 'cases' }, ...cases.map((ligne) => {
      const classes = ['ligne-cases'];
      if (ligne.cases > 1 || ligne.libelle !== '') classes.push('large');
      if (livre === LIVRE_LISTES && section === ligne.section) classes.push('en-cours');
      return el('li', { classe: classes.join(' '), test: 'ligne-cases' },
        el('span', { classe: 'ligne-numero', texte: String(ligne.section) }),
        ...libelleLigne(ligne),
        casesLigne(contexte, p, LIVRE_LISTES, ligne));
    })));
  return [el('p', { classe: 'legende source-listes', texte: t('codes.source', { livre: LIVRE_LISTES }) }), blocCodes, blocCases];
}

// ---- Lot v0.8 — les biens : les lieux (stockées, investissements, dépôts) et le navire ------------------

// Les trois listes de lieux : la lettre de l'adresse qui ouvre une carte, le titre, la légende vide, l'intitulé de
// l'ajout, le « retirer » de l'éditeur.
const LISTES_LIEUX = {
  investissements: {
    lettre: 'i',
    titre: () => t('biens.investissements'),
    vide: () => t('biens.investissements_vide'),
    ajout: () => t('biens.investissement_nouveau'),
    retirer: () => t('biens.investissement_retirer'),
  },
  depots: {
    lettre: 'd',
    titre: () => t('biens.depots'),
    vide: () => t('biens.depots_vide'),
    ajout: () => t('biens.depot_nouveau'),
    retirer: () => t('biens.depot_retirer'),
  },
  stockees: {
    lettre: 's',
    titre: () => t('biens.stockees'),
    vide: () => t('biens.stockees_vide'),
    ajout: () => t('biens.stockee_nouveau'),
    retirer: () => t('biens.lieu_retirer'),
  },
};

// Le nom d'une qualité d'équipage : une table code → texte.
const NOM_EQUIPAGE = {
  mauvais: () => t('biens.equipage_mauvais'),
  moyen: () => t('biens.equipage_moyen'),
  bon: () => t('biens.equipage_bon'),
  'hors-pair': () => t('biens.equipage_hors_pair'),
};

// Un champ texte d'un lieu ou du navire : son libellé en placeholder et en aria-label.
function champTexteBien(test, libelle, valeur) {
  const champ = el('input', { type: 'text', test, placeholder: libelle, 'aria-label': libelle });
  champ.value = valeur;
  return champ;
}

// Un champ nombre d'un lieu ou du navire, sa légende au-dessus ; sa valeur en attribut ('' pour null).
function champNombreBien(test, libelle, valeur) {
  const champ = el('input', {
    type: 'number', inputmode: 'numeric', min: '0', test, 'aria-label': libelle, value: valeur === null ? '' : String(valeur),
  });
  return { champ, bloc: el('label', {}, el('span', { classe: 'legende', texte: libelle }), champ) };
}

// Les champs d'un lieu, préfixe `prefixe` : le lieu, le livre, la section, la somme (sauf stockées), les conditions
// (dépôts seulement). `saisie()` rend { lieu, livre, section, somme, conditions } tels que saisis.
function champsLieu(prefixe, liste, valeurs) {
  const nomLieu = champTexteBien(`${prefixe}-lieu`, t('biens.lieu'), valeurs.lieu);
  const livre = champNombreBien(`${prefixe}-livre`, t('perso.livre'), valeurs.livre);
  const section = champNombreBien(`${prefixe}-section`, t('perso.section'), valeurs.section);
  const bloc = el('div', { classe: liste === 'stockees' ? 'champs-lieu sans-somme' : 'champs-lieu' }, nomLieu, livre.bloc, section.bloc);
  const somme = liste === 'stockees' ? null : champNombreBien(`${prefixe}-somme`, t('biens.somme'), valeurs.somme);
  if (somme !== null) bloc.append(somme.bloc);
  const conditions = liste === 'depots' ? champTexteBien(`${prefixe}-conditions`, t('biens.conditions'), valeurs.conditions) : null;
  if (conditions !== null) bloc.append(conditions);
  return {
    bloc,
    saisie: () => ({
      lieu: nomLieu.value,
      livre: livre.champ.value,
      section: section.champ.value,
      somme: somme === null ? '' : somme.champ.value,
      conditions: conditions === null ? '' : conditions.value,
    }),
  };
}

// Un champ texte et son bouton « Ajouter » ; la touche Entrée dans le champ ajoute aussi (le déclencheur est alors le
// champ). `inactif` : le champ et le bouton sont désactivés.
function ajoutBien(contexte, id, { testChamp, testBouton, placeholder, libelle, inactif = false }, ajouter) {
  const champ = el('input', { type: 'text', test: testChamp, placeholder, 'aria-label': libelle });
  const bouton = el('button', { classe: 'bouton bouton-second', type: 'button', test: testBouton, texte: t('feuille.ajouter') });
  if (inactif) {
    champ.setAttribute('disabled', '');
    bouton.setAttribute('disabled', '');
  }
  const ajout = (declencheur) => changer(contexte, id, (q) => ajouter(q, champ.value), { declencheur });
  bouton.addEventListener('click', () => ajout(bouton));
  champ.addEventListener('keydown', (evenement) => {
    if (evenement.key !== 'Enter') return;
    evenement.preventDefault();
    ajout(champ);
  });
  return el('div', { classe: 'ajout' }, champ, bouton);
}

// Une transformation refusée le dit dans `erreur` (le texte `texte`) ; acceptée, l'erreur est vidée.
const avecErreur = (erreur, texte, transformer) => (q) => {
  const nouveau = transformer(q);
  erreur.textContent = nouveau === null ? texte : '';
  return nouveau;
};

// La carte du lieu `n` de la liste `liste` : son nom et sa pastille, les conditions d'un dépôt, sa somme à − / + ou
// ses objets, « Modifier » ; ouverte, son éditeur.
function carteLieu(contexte, p, base, liste, n, ouverte) {
  const entree = p[liste][n];
  const { lettre, retirer } = LISTES_LIEUX[liste];
  const entete = el('div', { classe: 'bien-entete' }, el('p', { classe: 'nom', test: 'bien-nom', texte: entree.lieu }));
  if (entree.section !== null) {
    entete.append(pastille(contexte, p, { livre: entree.livre ?? p.section_en_cours.livre, section: entree.section }, 'bien-pas'));
  }
  const carte = el('li', { classe: `cadre bien ${liste}`, test: 'bien' }, entete);
  if (liste === 'depots' && entree.conditions !== '') {
    carte.append(el('p', { classe: 'conditions' },
      el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('biens.conditions') }) }), ` ${entree.conditions}`));
  }
  if (liste === 'stockees') {
    if (entree.objets.length === 0) {
      carte.append(el('p', { classe: 'legende', texte: t('biens.objets_vide') }));
    } else {
      carte.append(el('ul', { classe: 'stock', test: 'objets-stockes' }, ...entree.objets.map((objet, rang) => el('li', {},
        el('span', { classe: 'objet', texte: objet }),
        action(boutonRetirer('lien', t('feuille.retirer'), objet), contexte, p.id, (q) => retirerObjetStocke(q, n, rang))))));
    }
    carte.append(ajoutBien(contexte, p.id, {
      testChamp: 'stocke-champ',
      testBouton: 'stocke-ajouter',
      placeholder: t('feuille.possession_ajouter'),
      libelle: t('biens.objet_ajouter', { lieu: entree.lieu }),
    }, (q, texte) => ajouterObjetStocke(q, n, texte)));
  } else {
    const somme = compteur('moyen', [String(entree.somme), el('span', { classe: 'sur', texte: ` ${t('feuille.chardes')}` })],
      { test: 'somme-moins', libelle: t('biens.somme_moins', { lieu: entree.lieu }) },
      { test: 'somme-plus', libelle: t('biens.somme_plus', { lieu: entree.lieu }) });
    action(somme.querySelector('[data-test=somme-moins]'), contexte, p.id, (q) => changerSomme(q, liste, n, -1));
    action(somme.querySelector('[data-test=somme-plus]'), contexte, p.id, (q) => changerSomme(q, liste, n, 1));
    carte.append(somme);
  }
  carte.append(el('div', { classe: 'actions' },
    el('a', { classe: 'lien', test: 'bien-modifier', href: ouverte ? base : `${base}/${lettre}${n}`, texte: ouverte ? t('feuille.fermer') : t('feuille.modifier') })));
  if (!ouverte) return carte;
  // Écrit, l'adresse revient à la rubrique ; refusé, rien n'est écrit et l'éditeur reste ouvert.
  const champs = champsLieu('edition', liste, entree);
  const erreur = el('p', { classe: 'erreur', role: 'alert' });
  const enregistrer = el('button', { classe: 'bouton', type: 'button', test: 'bien-enregistrer', texte: t('feuille.enregistrer') });
  action(enregistrer, contexte, p.id, avecErreur(erreur, t('biens.lieu_requis'), (q) => modifierLieu(q, liste, n, champs.saisie())), { ancre: base });
  carte.append(el('div', { classe: 'editeur', test: 'editeur-bien' },
    champs.bloc,
    erreur,
    el('div', { classe: 'actions' },
      enregistrer,
      boutonDeuxTemps(contexte, p.id, { classe: 'lien lien-danger', test: 'bien-retirer', texte: retirer(), nom: entree.lieu },
        (q) => retirerDeListe(q, liste, n), { ancre: base }))));
  return carte;
}

// Le bloc d'une liste de lieux : son titre, ses cartes (ou sa légende vide), puis l'ajout replié. `ouverte` : l'index
// de la carte ouverte, ou null.
function blocLieux(contexte, p, base, liste, ouverte) {
  const { titre, vide, ajout } = LISTES_LIEUX[liste];
  const section = el('section', { classe: 'bloc', test: liste }, el('h2', { classe: 'rubrique', texte: titre() }));
  if (p[liste].length === 0) {
    section.append(el('p', { classe: 'legende', texte: vide() }));
  } else {
    section.append(el('ul', { classe: 'entrees' }, ...p[liste].map((_, n) => carteLieu(contexte, p, base, liste, n, n === ouverte))));
  }
  const champs = champsLieu(`nouveau-${liste}`, liste, { lieu: '', livre: p.section_en_cours.livre, section: null, somme: null, conditions: '' });
  const erreur = el('p', { classe: 'erreur', role: 'alert' });
  const ajouter = el('button', { classe: 'bouton', type: 'button', test: `${liste}-ajouter`, texte: t('feuille.ajouter') });
  action(ajouter, contexte, p.id, avecErreur(erreur, t('biens.lieu_requis'), (q) => ajouterLieu(q, liste, champs.saisie())));
  section.append(el('details', { classe: 'ajout-entree', test: `nouveau-${liste}` },
    el('summary', { classe: 'lien', texte: ajout() }),
    el('div', { classe: 'champs-entree' }, champs.bloc, erreur, ajouter)));
  return section;
}

// Les champs du navire, préfixe `prefixe` : le nom, le type, la qualité de l'équipage, la cargaison maximale, le
// lieu d'amarrage. `saisie()` rend { nom, type, equipage, cargaison_max, amarrage } tels que saisis.
function champsNavire(prefixe, valeurs) {
  const nom = champTexteBien(`${prefixe}-nom`, t('biens.navire_nom'), valeurs.nom);
  const type = champTexteBien(`${prefixe}-type`, t('biens.navire_type'), valeurs.type);
  const equipage = el('select', { test: `${prefixe}-equipage`, 'aria-label': t('biens.equipage') },
    ...EQUIPAGES.map((code) => el('option', { value: code, texte: NOM_EQUIPAGE[code]() })));
  equipage.value = valeurs.equipage;
  const max = champNombreBien(`${prefixe}-max`, t('biens.cargaison_max'), valeurs.cargaison_max);
  const amarrage = champTexteBien(`${prefixe}-amarrage`, t('biens.amarrage'), valeurs.amarrage);
  return {
    bloc: el('div', { classe: 'champs-navire' },
      nom,
      type,
      el('label', {}, el('span', { classe: 'legende', texte: t('biens.equipage') }), equipage),
      max.bloc,
      amarrage),
    saisie: () => ({ nom: nom.value, type: type.value, equipage: equipage.value, cargaison_max: max.champ.value, amarrage: amarrage.value }),
  };
}

// Le navire : sans navire, la légende et l'ajout replié ; avec, sa carte (son nom, son type, son équipage, son lieu
// d'amarrage, sa cargaison « n / max », « Modifier ») et, ouvert, son éditeur.
function blocNavire(contexte, p, base, ouvert) {
  const section = el('section', { classe: 'bloc', test: 'navire' }, el('h2', { classe: 'rubrique', texte: t('biens.navire') }));
  const { navire } = p;
  if (navire === null) {
    const champs = champsNavire('nouveau-navire', { nom: '', type: '', equipage: 'moyen', cargaison_max: null, amarrage: '' });
    const erreur = el('p', { classe: 'erreur', role: 'alert' });
    const ajouter = el('button', { classe: 'bouton', type: 'button', test: 'navire-ajouter', texte: t('feuille.ajouter') });
    action(ajouter, contexte, p.id, avecErreur(erreur, t('biens.navire_requis'), (q) => acquerirNavire(q, champs.saisie())));
    section.append(el('p', { classe: 'legende', texte: t('biens.navire_vide') }),
      el('details', { classe: 'ajout-entree', test: 'nouveau-navire' },
        el('summary', { classe: 'lien', texte: t('biens.navire_nouveau') }),
        el('div', { classe: 'champs-entree' }, champs.bloc, erreur, ajouter)));
    return section;
  }
  const entete = el('div', { classe: 'bien-entete' }, el('p', { classe: 'nom', test: 'navire-nom', texte: navire.nom }));
  if (navire.type !== '') entete.append(el('span', { classe: 'legende navire-type', texte: navire.type }));
  const carte = el('div', { classe: 'cadre bien navire', test: 'carte-navire' },
    entete,
    el('p', { classe: 'navire-detail' },
      el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('biens.equipage') }) }), ` ${NOM_EQUIPAGE[navire.equipage]()}`));
  if (navire.amarrage !== '') {
    carte.append(el('p', { classe: 'navire-detail' },
      el('span', { classe: 'legende', texte: t('feuille.etiquette', { libelle: t('biens.amarrage') }) }), ` ${navire.amarrage}`));
  }
  const pleine = navire.cargaison.length >= navire.cargaison_max;
  carte.append(el('p', { classe: 'petit-titre cale' }, t('biens.cargaison'),
    el('span', { classe: 'compte', test: 'cargaison-compte', texte: ` ${navire.cargaison.length} / ${navire.cargaison_max}` })));
  if (navire.cargaison.length === 0) {
    carte.append(el('p', { classe: 'legende', texte: t('biens.cargaison_vide') }));
  } else {
    carte.append(el('ol', { classe: 'stock cargaison', test: 'cargaison' }, ...navire.cargaison.map((unite, rang) => el('li', {},
      el('span', { classe: 'objet', texte: unite }),
      action(boutonRetirer('lien', t('feuille.retirer'), unite), contexte, p.id, (q) => retirerCargaison(q, rang))))));
  }
  carte.append(ajoutBien(contexte, p.id, {
    testChamp: 'cargaison-champ',
    testBouton: 'cargaison-ajouter',
    placeholder: t('biens.cargaison_ajouter'),
    libelle: t('biens.cargaison_ajouter'),
    inactif: pleine,
  }, ajouterCargaison));
  if (pleine) carte.append(el('p', { classe: 'legende', test: 'cale-pleine', texte: t('biens.cargaison_pleine') }));
  carte.append(el('div', { classe: 'actions' },
    el('a', { classe: 'lien', test: 'navire-modifier', href: ouvert ? base : `${base}/n`, texte: ouvert ? t('feuille.fermer') : t('feuille.modifier') })));
  if (ouvert) {
    // Écrit, l'adresse revient à la rubrique ; refusé, rien n'est écrit et l'éditeur reste ouvert.
    const champs = champsNavire('edition-navire', navire);
    const erreur = el('p', { classe: 'erreur', role: 'alert' });
    const enregistrer = el('button', { classe: 'bouton', type: 'button', test: 'navire-enregistrer', texte: t('feuille.enregistrer') });
    action(enregistrer, contexte, p.id, avecErreur(erreur, t('biens.navire_requis'), (q) => modifierNavire(q, champs.saisie())), { ancre: base });
    carte.append(el('div', { classe: 'editeur', test: 'editeur-navire' },
      champs.bloc,
      erreur,
      el('div', { classe: 'actions' },
        enregistrer,
        boutonDeuxTemps(contexte, p.id, { classe: 'lien lien-danger', test: 'navire-retirer', texte: t('biens.navire_retirer'), nom: navire.nom },
          (q) => retirerNavire(q), { ancre: base }))));
  }
  section.append(carte);
  return section;
}

// La rubrique Biens : les investissements, les dépôts, puis le navire. `ouvert` : le quatrième morceau de l'adresse
// (i<n> ouvre l'investissement n, d<n> le dépôt n, n le navire), ou null.
function rubriqueBiens(contexte, p, base, ouvert) {
  return [
    blocLieux(contexte, p, base, 'investissements', indexOuvert(ouvert, 'i', p.investissements)),
    blocLieux(contexte, p, base, 'depots', indexOuvert(ouvert, 'd', p.depots)),
    blocNavire(contexte, p, base, ouvert === 'n'),
  ];
}

// ---- La fiche ------------------------------------------------------------------------------------------

// La fiche : #/perso/<id>[/<rubrique>[/<déplié>]] ; route = { id, rubrique, deplie, objet, ouvert } (lot v0.4 : `objet`,
// l'index de l'objet ouvert des Possessions ; lot v0.6 : `ouvert`, la quête ou l'adversaire ouvert ; lot v0.8 : aussi le
// bien ouvert, ou le lieu de stockage ouvert des Possessions).
export async function vueFiche(contexte, route) {
  await file;
  const p = await lirePersonnage(route.id).catch(() => null);
  if (p === null) {
    return [el('h1', { texte: t('fiche.introuvable') }), el('p', {}, lienRetour())];
  }
  const racine = `#/perso/${encodeURIComponent(p.id)}`;
  const ligne = el('p', { classe: 'ligne', texte: ligneProfession(p) });
  if (p.pretire !== null) ligne.append(' · ', lienExterne('lien', 'fiche-alkonost', t('pretire.lire_fiche')));
  const onglets = el('nav', { classe: 'sous-onglets rubriques-fiche', 'aria-label': t('feuille.rubriques') }, ...RUBRIQUES.map(([code, texte]) => {
    const lien = el('a', { test: 'sous-onglet', href: `${racine}/${code}`, texte: texte() });
    if (code === route.rubrique) lien.setAttribute('aria-current', 'page');
    return lien;
  }));
  let contenu;
  if (route.rubrique === 'possessions') contenu = rubriquePossessions(contexte, p, `${racine}/possessions`, route.objet, route.ouvert);
  else if (route.rubrique === 'cultes') contenu = rubriqueCultes(contexte, p);
  else if (route.rubrique === 'aventure') contenu = rubriqueAventure(contexte, p, `${racine}/aventure`, route.ouvert);
  else if (route.rubrique === 'combats') contenu = rubriqueCombats(contexte, p, `${racine}/combats`, route.ouvert);
  else if (route.rubrique === 'codes') contenu = rubriqueCodes(contexte, p);
  else if (route.rubrique === 'biens') contenu = rubriqueBiens(contexte, p, `${racine}/biens`, route.ouvert);
  else {
    const deplie = DEPLIABLES.includes(route.deplie) ? route.deplie : null;
    contenu = rubriqueStatistiques(contexte, p, `${racine}/statistiques`, deplie);
  }
  return [el('h1', { test: 'nom', texte: p.nom }), ligne, onglets, ...contenu,
    el('div', { classe: 'marge-des', 'aria-hidden': 'true' }), await barreDes()];
}
