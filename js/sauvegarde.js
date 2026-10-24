// Lot v0.1 — le format de sauvegarde (schéma 1) : lecture d'un fichier, construction de l'export,
// personnage neuf. Ce module s'importe dans Node : rien n'y touche window, document ou indexedDB.
// Lot v0.3 — le schéma 2 : la feuille d'aventure, sa complétion (aussi celle d'un personnage lu du stockage)
// et la migration depuis le schéma 1.
import { COMPETENCES } from './regles.js';

export const FORMAT = 'fabled-lands-helper';
export const SCHEMA = 2;

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

// Un personnage lu (d'un fichier importé ou du stockage) : complété des valeurs par défaut manquantes, au schéma 2,
// ses champs inconnus conservés tels quels ; une copie qui ne partage rien avec `brut`. Lève une exception si le
// personnage n'a pas d'id ou pas de nom.
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
  personnage.possessions = completerTextes(personnage.possessions);
  personnage.titres = completerTextes(personnage.titres);
  personnage.benedictions = completerEntrees(personnage.benedictions, completerCulte);
  personnage.maledictions = completerEntrees(personnage.maledictions, completerCulte);
  personnage.resurrections = completerEntrees(personnage.resurrections, completerResurrection);
  personnage.histoire = texteOuVide(personnage.histoire);
  if (!estChaineNonVide(personnage.pretire)) personnage.pretire = null;
  return personnage;
}

// Rend { schema: SCHEMA, personnages } à partir de l'objet JSON d'un fichier exporté (schéma 1 ou 2),
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

// Un personnage neuf : niveau 1, livre 1 section 1 ; lot v0.3 — sa feuille aux valeurs neutres du schéma 2.
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
  };
}
