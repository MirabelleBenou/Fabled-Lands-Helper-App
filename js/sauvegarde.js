// Lot v0.1 — le format de sauvegarde (schéma 1) : lecture d'un fichier, construction de l'export,
// personnage neuf. Ce module s'importe dans Node : rien n'y touche window, document ou indexedDB.
// Lot v0.3 — le schéma 2 : la feuille d'aventure, sa complétion (aussi celle d'un personnage lu du stockage)
// et la migration depuis le schéma 1.
// Lot v0.4 — le schéma 3 : une possession devient un objet { texte, bonus } ; les bonus saisis à la main au nom
// d'un objet transporté passent sur cet objet (le rattachement, depuis le schéma 1 ou 2 seulement).
// Lot v0.6 — le schéma 4 : le journal, quatre listes de plus (historique, quêtes, notes, combats), et leur complétion.
// Lot v0.7 — le schéma 5 : les codes et les cases de section cochés, les codes liés d'une quête, et leur complétion.
// Lot v0.8 — le schéma 6 : les biens (possessions stockées, investissements, dépôts, navire), et leur complétion.
import { CIBLES, COMPETENCES, EQUIPAGES, MAX_HISTORIQUE } from './regles.js';

export const FORMAT = 'fabled-lands-helper';
export const SCHEMA = 6;

const EPOQUE_ZERO = '1970-01-01T00:00:00.000Z';

const estChaineNonVide = (valeur) => typeof valeur === 'string' && valeur !== '';
const estPositif = (valeur) => Number.isInteger(valeur) && valeur >= 0;

function estObjet(valeur) {
  return valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);
}

function sectionValide(valeur) {
  return estObjet(valeur) && Number.isInteger(valeur.livre) && (valeur.section === null || Number.isInteger(valeur.section));
}

// Lot v0.3 — les valeurs neutres du schéma 2 : chaque champ absent ou invalide les reçoit ; les champs inconnus restent.
function completerBonus(valeur) {
  if (!Array.isArray(valeur)) return [];
  return valeur.filter((b) => estObjet(b) && Number.isInteger(b.valeur) && b.valeur !== 0 && estChaineNonVide(b.raison));
}

function completerEndurance(valeur) {
  const endurance = estObjet(valeur) ? valeur : {};
  const max = estPositif(endurance.max) ? endurance.max : 0;
  const actuelle = Number.isInteger(endurance.actuelle) ? Math.min(Math.max(endurance.actuelle, 0), max) : 0;
  return { ...endurance, max, actuelle };
}

function completerCompetence(valeur) {
  if (!estObjet(valeur)) return { initiale: 0, actuelle: 0, bonus: [] };
  return {
    ...valeur,
    initiale: estPositif(valeur.initiale) ? valeur.initiale : 0,
    actuelle: estPositif(valeur.actuelle) ? valeur.actuelle : 0,
    bonus: completerBonus(valeur.bonus),
  };
}

function completerCompetences(valeur) {
  const competences = estObjet(valeur) ? { ...valeur } : {};
  for (const code of COMPETENCES) competences[code] = completerCompetence(competences[code]);
  return competences;
}

const completerTextes = (valeur) => (Array.isArray(valeur) ? valeur.filter(estChaineNonVide) : []);

// Lot v0.4 — le bonus d'un objet : gardé s'il vise une cible de CIBLES avec une valeur entière non nulle (seuls
// `cible` et `valeur` restent), sinon null.
function completerBonusObjet(valeur) {
  if (!estObjet(valeur) || !CIBLES.includes(valeur.cible) || !Number.isInteger(valeur.valeur) || valeur.valeur === 0) return null;
  return { cible: valeur.cible, valeur: valeur.valeur };
}

// Lot v0.4 — les possessions au schéma 3 : une chaîne non vide devient { texte, bonus: null } ; un objet au texte non
// vide est gardé (ses champs inconnus aussi), son bonus complété ; toute autre entrée est retirée.
function completerPossessions(valeur) {
  if (!Array.isArray(valeur)) return [];
  const objets = [];
  for (const entree of valeur) {
    if (estChaineNonVide(entree)) objets.push({ texte: entree, bonus: null });
    else if (estObjet(entree) && estChaineNonVide(entree.texte)) objets.push({ ...entree, bonus: completerBonusObjet(entree.bonus) });
  }
  return objets;
}

const nomCompare = (texte) => texte.trim().toLocaleLowerCase('fr');

// Lot v0.4 — le rattachement : pour chaque cible dans l'ordre de CIBLES, chaque bonus à la main (de la fin vers le
// début de sa liste) dont la raison égale le texte d'un objet transporté sans bonus (bords retirés, en minuscules)
// passe sur le premier de ces objets et quitte la liste à la main.
function rattacher(personnage) {
  for (const cible of CIBLES) {
    const bonus = cible === 'defense' ? personnage.defense.bonus : personnage.competences[cible].bonus;
    for (let i = bonus.length - 1; i >= 0; i -= 1) {
      const raison = nomCompare(bonus[i].raison);
      const objet = personnage.possessions.find((o) => o.bonus === null && nomCompare(o.texte) === raison);
      if (objet === undefined) continue;
      objet.bonus = { cible, valeur: bonus[i].valeur };
      bonus.splice(i, 1);
    }
  }
}

const texteOuVide = (valeur) => (typeof valeur === 'string' ? valeur : '');
const entierOuNul = (valeur) => (Number.isInteger(valeur) ? valeur : null);

function completerEntrees(valeur, completerEntree) {
  return Array.isArray(valeur) ? valeur.filter(estObjet).map(completerEntree) : [];
}

const completerCulte = (e) => ({ ...e, origine: texteOuVide(e.origine), consequences: texteOuVide(e.consequences) });
const completerResurrection = (e) => ({
  ...e,
  origine: texteOuVide(e.origine),
  lieu: texteOuVide(e.lieu),
  livre: entierOuNul(e.livre),
  section: entierOuNul(e.section),
});

// Lot v0.6 — le journal. Une section du chemin ou d'une quête : un objet aux deux entiers ≥ 1 (livre, section).
const estLivreEtSection = (valeur) => estObjet(valeur) && Number.isInteger(valeur.livre) && valeur.livre >= 1
  && Number.isInteger(valeur.section) && valeur.section >= 1;
const booleenOuFaux = (valeur) => (typeof valeur === 'boolean' ? valeur : false);

// Lot v0.6 — chaque liste absente ou qui n'est pas un tableau devient [] ; une entrée gardée garde ses champs inconnus.
const garder = (valeur, garde) => (Array.isArray(valeur) ? valeur.filter(garde) : []);

// L'historique : les entrées invalides retirées, puis seules les MAX_HISTORIQUE dernières restent.
const completerHistorique = (valeur) => garder(valeur, estLivreEtSection).slice(-MAX_HISTORIQUE);

// Lot v0.7 — des codes : seules les chaînes non vides restent, et seule la première occurrence d'un doublon.
const completerCodes = (valeur) => garder(valeur, estChaineNonVide).filter((code, index, codes) => codes.indexOf(code) === index);

const completerQuete = (e) => ({
  ...e,
  personnages: texteOuVide(e.personnages),
  sections: garder(e.sections, estLivreEtSection),
  // Lot v0.7 — les codes liés.
  codes: completerCodes(e.codes),
  terminee: booleenOuFaux(e.terminee),
});

const completerNote = (e, reference) => ({
  ...e,
  livre: entierOuNul(e.livre),
  section: entierOuNul(e.section),
  ecrite_le: typeof e.ecrite_le === 'string' ? e.ecrite_le : reference,
});

const completerCombat = (e) => ({
  ...e,
  combat: estPositif(e.combat) ? e.combat : 0,
  defense: estPositif(e.defense) ? e.defense : 0,
  endurance: completerEndurance(e.endurance),
  livre: entierOuNul(e.livre),
  section: entierOuNul(e.section),
  termine: booleenOuFaux(e.termine),
});

// Lot v0.7 — une ligne de cases : ses rangs (pas un tableau → []) ne gardent que les entiers ≥ 0, sans doublon, triés
// croissants ; elle est gardée si livre et section sont des entiers ≥ 1, libelle une chaîne et rangs non vide, ses
// champs inconnus conservés ; sinon null. Le livret n'est pas consulté.
function completerLigneCases(e) {
  const rangs = garder(e.rangs, estPositif).filter((rang, index, liste) => liste.indexOf(rang) === index).sort((a, b) => a - b);
  const valide = Number.isInteger(e.livre) && e.livre >= 1 && Number.isInteger(e.section) && e.section >= 1
    && typeof e.libelle === 'string' && rangs.length > 0;
  return valide ? { ...e, rangs } : null;
}

const completerCases = (valeur) => garder(valeur, estObjet).map(completerLigneCases).filter((e) => e !== null);

// Lot v0.8 — les biens. Un livre ou une section d'un lieu : un entier ≥ 1, sinon null.
const repereOuNul = (valeur) => (Number.isInteger(valeur) && valeur >= 1 ? valeur : null);

// Une liste de lieux (stockées, investissements, dépôts) : une entrée est gardée si c'est un objet au lieu non vide,
// ses champs inconnus conservés ; `completerEntree` complète ses champs propres.
const completerLieux = (valeur, completerEntree) => garder(valeur, (e) => estObjet(e) && estChaineNonVide(e.lieu))
  .map((e) => completerEntree({ ...e, livre: repereOuNul(e.livre), section: repereOuNul(e.section) }));

const completerStockee = (e) => ({ ...e, objets: completerTextes(e.objets) });
const completerInvestissement = (e) => ({ ...e, somme: estPositif(e.somme) ? e.somme : 0 });
const completerDepot = (e) => ({ ...e, conditions: texteOuVide(e.conditions), somme: estPositif(e.somme) ? e.somme : 0 });

// Le navire : gardé si c'est un objet au nom non vide, ses champs inconnus conservés ; sinon null.
function completerNavire(valeur) {
  if (!estObjet(valeur) || !estChaineNonVide(valeur.nom)) return null;
  return {
    ...valeur,
    type: texteOuVide(valeur.type),
    equipage: EQUIPAGES.includes(valeur.equipage) ? valeur.equipage : 'moyen',
    cargaison_max: estPositif(valeur.cargaison_max) ? valeur.cargaison_max : 0,
    amarrage: texteOuVide(valeur.amarrage),
    cargaison: completerTextes(valeur.cargaison),
  };
}

// Un personnage lu (d'un fichier importé ou du stockage) : complété des valeurs par défaut manquantes, au schéma 3
// (lot v0.4), puis au schéma 4 (lot v0.6), puis au schéma 5 (lot v0.7), puis au schéma 6 (lot v0.8), ses champs inconnus conservés tels quels ; une copie qui ne partage rien avec `brut`. Lève une
// exception si le personnage n'a pas d'id ou pas de nom.
export function completerPersonnage(brut, reference = EPOQUE_ZERO) {
  if (!estObjet(brut) || !estChaineNonVide(brut.id) || !estChaineNonVide(brut.nom)) {
    throw new Error('personnage illisible');
  }
  const personnage = structuredClone(brut);
  if (typeof personnage.profession !== 'string') personnage.profession = '';
  if (!Number.isInteger(personnage.niveau) || personnage.niveau < 1) personnage.niveau = 1;
  if (!sectionValide(personnage.section_en_cours)) personnage.section_en_cours = { livre: 1, section: 1 };
  if (typeof personnage.cree_le !== 'string') personnage.cree_le = reference;
  if (typeof personnage.modifie_le !== 'string') personnage.modifie_le = reference;
  personnage.endurance = completerEndurance(personnage.endurance);
  personnage.competences = completerCompetences(personnage.competences);
  personnage.defense = estObjet(personnage.defense)
    ? { ...personnage.defense, bonus: completerBonus(personnage.defense.bonus) }
    : { bonus: [] };
  if (!estPositif(personnage.bourse)) personnage.bourse = 0;
  // Lot v0.4 — des possessions en texte (schéma 1 ou 2) : leurs bonus à la main se rattachent aux objets.
  const ancien = Array.isArray(personnage.possessions) && personnage.possessions.some((entree) => typeof entree === 'string');
  personnage.possessions = completerPossessions(personnage.possessions);
  if (ancien) rattacher(personnage);
  personnage.titres = completerTextes(personnage.titres);
  personnage.benedictions = completerEntrees(personnage.benedictions, completerCulte);
  personnage.maledictions = completerEntrees(personnage.maledictions, completerCulte);
  personnage.resurrections = completerEntrees(personnage.resurrections, completerResurrection);
  personnage.histoire = texteOuVide(personnage.histoire);
  if (!estChaineNonVide(personnage.pretire)) personnage.pretire = null;
  // Lot v0.6 — le journal.
  personnage.historique = completerHistorique(personnage.historique);
  personnage.quetes = garder(personnage.quetes, (e) => estObjet(e) && estChaineNonVide(e.titre)).map(completerQuete);
  personnage.notes = garder(personnage.notes, (e) => estObjet(e) && estChaineNonVide(e.texte)).map((e) => completerNote(e, reference));
  personnage.combats = garder(personnage.combats, (e) => estObjet(e) && estChaineNonVide(e.nom)).map(completerCombat);
  // Lot v0.7 — les codes et les cases de section.
  personnage.codes = completerCodes(personnage.codes);
  personnage.cases = completerCases(personnage.cases);
  // Lot v0.8 — les biens.
  personnage.stockees = completerLieux(personnage.stockees, completerStockee);
  personnage.investissements = completerLieux(personnage.investissements, completerInvestissement);
  personnage.depots = completerLieux(personnage.depots, completerDepot);
  personnage.navire = completerNavire(personnage.navire);
  return personnage;
}

// Rend { schema: SCHEMA, personnages } à partir de l'objet JSON d'un fichier exporté (schéma 1 à 6),
// ou lève une exception si le fichier est illisible (code « SCHEMA_RECENT » s'il vient d'un schéma plus récent).
export function lire(objet) {
  if (!estObjet(objet)) throw new Error('sauvegarde illisible');
  if (objet.format !== FORMAT) throw new Error('format inconnu');
  if (!Number.isInteger(objet.schema) || objet.schema < 1) throw new Error('numéro de schéma illisible');
  if (objet.schema > SCHEMA) {
    const erreur = new Error('sauvegarde d\'une version plus récente');
    erreur.code = 'SCHEMA_RECENT';
    throw erreur;
  }
  if (!Array.isArray(objet.personnages)) throw new Error('liste des personnages absente');
  const reference = typeof objet.exporte_le === 'string' ? objet.exporte_le : EPOQUE_ZERO;
  return { schema: SCHEMA, personnages: objet.personnages.map((p) => completerPersonnage(p, reference)) };
}

// L'objet du fichier exporté.
export function construireExport(personnages, maintenant = new Date()) {
  return { format: FORMAT, schema: SCHEMA, exporte_le: maintenant.toISOString(), personnages };
}

// fabled-lands-helper-AAAA-MM-JJ.flh.json, avec la date du jour (locale).
export function nomFichierExport(maintenant = new Date()) {
  const deux = (n) => String(n).padStart(2, '0');
  const jour = `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`;
  return `fabled-lands-helper-${jour}.flh.json`;
}

// Un personnage neuf : niveau 1, livre 1 section 1 ; lot v0.3 — sa feuille aux valeurs neutres du schéma 2 ;
// lot v0.6 — les quatre listes du journal, vides ; lot v0.7 — les codes et les cases de section, vides ;
// lot v0.8 — les biens : trois listes vides, pas de navire.
export function personnageNeuf(nom, profession, maintenant = new Date(), id = crypto.randomUUID()) {
  const iso = maintenant.toISOString();
  return {
    id,
    nom,
    profession,
    niveau: 1,
    section_en_cours: { livre: 1, section: 1 },
    cree_le: iso,
    modifie_le: iso,
    endurance: { max: 0, actuelle: 0 },
    competences: Object.fromEntries(COMPETENCES.map((code) => [code, { initiale: 0, actuelle: 0, bonus: [] }])),
    defense: { bonus: [] },
    bourse: 0,
    possessions: [],
    titres: [],
    benedictions: [],
    maledictions: [],
    resurrections: [],
    histoire: '',
    pretire: null,
    historique: [],
    quetes: [],
    notes: [],
    combats: [],
    codes: [],
    cases: [],
    stockees: [],
    investissements: [],
    depots: [],
    navire: null,
  };
}
