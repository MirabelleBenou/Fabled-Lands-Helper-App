// Lot v0.1 — le format de sauvegarde (schéma 1) : lecture d'un fichier, construction de l'export,
// personnage neuf. Ce module s'importe dans Node : rien n'y touche window, document ou indexedDB.
export const FORMAT = 'fabled-lands-helper';
export const SCHEMA = 1;

const EPOQUE_ZERO = '1970-01-01T00:00:00.000Z';

const estChaineNonVide = (valeur) => typeof valeur === 'string' && valeur !== '';

function estObjet(valeur) {
  return valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);
}

function sectionValide(valeur) {
  return estObjet(valeur) && Number.isInteger(valeur.livre) && (valeur.section === null || Number.isInteger(valeur.section));
}

// Un personnage lu : complété des valeurs par défaut manquantes, ses champs inconnus conservés tels quels.
function completer(brut, reference) {
  if (!estObjet(brut) || !estChaineNonVide(brut.id) || !estChaineNonVide(brut.nom)) {
    throw new Error('personnage illisible');
  }
  const personnage = structuredClone(brut);
  if (typeof personnage.profession !== 'string') personnage.profession = '';
  if (!Number.isInteger(personnage.niveau) || personnage.niveau < 1) personnage.niveau = 1;
  if (!sectionValide(personnage.section_en_cours)) personnage.section_en_cours = { livre: 1, section: 1 };
  if (typeof personnage.cree_le !== 'string') personnage.cree_le = reference;
  if (typeof personnage.modifie_le !== 'string') personnage.modifie_le = reference;
  return personnage;
}

// Rend { schema: SCHEMA, personnages } à partir de l'objet JSON d'un fichier exporté,
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
  return { schema: SCHEMA, personnages: objet.personnages.map((p) => completer(p, reference)) };
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

// Un personnage neuf : niveau 1, livre 1 section 1.
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
  };
}
