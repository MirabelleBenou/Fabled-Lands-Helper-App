// Lot v0.3 — la feuille d'aventure : la création (pré-tiré ou saisie libre) et la fiche d'un personnage, en trois
// rubriques (Statistiques, Possessions, Cultes). Chaque changement s'enregistre aussitôt, puis l'écran se rend à
// nouveau depuis le personnage enregistré. Le texte saisi ou importé n'entre jamais comme HTML.
import { t } from './i18n.js';
import { LIENS } from './liens.js';
import { PRETIRES, personnagePretire, pretireParId } from './pretires.js';
import {
  COMPETENCES,
  MAX_POSSESSIONS,
  ajouterBonus,
  ajouterEntree,
  ajouterPossession,
  ajouterTitre,
  changerBase,
  changerBourse,
  changerEndurance,
  changerEnduranceMax,
  changerNiveau,
  defense,
  feuilleLibre,
  operationBourse,
  retirerBonus,
  retirerDeListe,
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
];
const DEPLIABLES = [...COMPETENCES, 'defense', 'endurance'];

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
  const noeuds = [
    el('p', { classe: 'legende source-pretires', texte: t('pretire.source') }),
    lienExterne('lien', 'lien-pretires', t('pretire.lire_toutes')),
    el('ul', { classe: 'pretires' }, ...PRETIRES.map((p) => cartePretire(p, p === choisi))),
  ];
  if (choisi !== null) {
    const champ = champNom(choisi.nom);
    const formulaire = el('form', { novalidate: '' }, champ.bloc, actionsCreation());
    surCreation(contexte, formulaire, champ, (nom) => personnagePretire(choisi, nom));
    noeuds.push(formulaire);
  }
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
async function changer(contexte, id, transformer, { declencheur = null, rendre = true } = {}) {
  const test = declencheur?.dataset?.test;
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
  if (issue === 'disparu' || (issue === 'ecrit' && rendre)) {
    await contexte.rafraichir();
    if (test) document.querySelector(`#ecran [data-test="${test}"]`)?.focus({ preventScroll: true });
  }
}

// Un bouton (ou un élément) qui, touché, applique `transformer`.
function action(element, contexte, id, transformer) {
  element.addEventListener('click', () => changer(contexte, id, transformer, { declencheur: element }));
  return element;
}

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

function rubriquePossessions(contexte, p) {
  const plein = p.possessions.length >= MAX_POSSESSIONS;
  const noeuds = [
    blocBourse(contexte, p),
    el('h2', { classe: 'rubrique' }, t('feuille.transportees'),
      el('span', { classe: 'compte', test: 'compte-possessions', texte: ` ${p.possessions.length} / ${MAX_POSSESSIONS}` })),
  ];
  if (p.possessions.length === 0) {
    noeuds.push(el('p', { classe: 'legende', texte: t('feuille.possessions_vide') }));
  } else {
    noeuds.push(el('ol', { classe: 'possessions', test: 'possessions' }, ...p.possessions.map((objet, index) => el('li', {},
      el('span', { classe: 'objet', texte: objet }),
      action(boutonRetirer('lien', t('feuille.retirer'), objet), contexte, p.id, (q) => retirerDeListe(q, 'possessions', index))))));
  }
  noeuds.push(ajoutTexte(contexte, p.id, 'possession-champ', 'possession-ajouter', t('feuille.possession_ajouter'), ajouterPossession, plein));
  if (plein) noeuds.push(el('p', { classe: 'legende', test: 'plein', texte: t('feuille.possessions_plein') }));
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

// ---- La fiche ------------------------------------------------------------------------------------------

// La fiche : #/perso/<id>[/<rubrique>[/<déplié>]] ; route = { id, rubrique, deplie }.
export async function vueFiche(contexte, route) {
  await file;
  const p = await lirePersonnage(route.id).catch(() => null);
  if (p === null) {
    return [el('h1', { texte: t('fiche.introuvable') }), el('p', {}, lienRetour())];
  }
  const racine = `#/perso/${encodeURIComponent(p.id)}`;
  const ligne = el('p', { classe: 'ligne', texte: ligneProfession(p) });
  if (p.pretire !== null) ligne.append(' · ', lienExterne('lien', 'fiche-alkonost', t('pretire.lire_fiche')));
  const onglets = el('nav', { classe: 'sous-onglets', 'aria-label': t('feuille.rubriques') }, ...RUBRIQUES.map(([code, texte]) => {
    const lien = el('a', { test: 'sous-onglet', href: `${racine}/${code}`, texte: texte() });
    if (code === route.rubrique) lien.setAttribute('aria-current', 'page');
    return lien;
  }));
  let contenu;
  if (route.rubrique === 'possessions') contenu = rubriquePossessions(contexte, p);
  else if (route.rubrique === 'cultes') contenu = rubriqueCultes(contexte, p);
  else {
    const deplie = DEPLIABLES.includes(route.deplie) ? route.deplie : null;
    contenu = rubriqueStatistiques(contexte, p, `${racine}/statistiques`, deplie);
  }
  return [el('h1', { test: 'nom', texte: p.nom }), ligne, onglets, ...contenu];
}
