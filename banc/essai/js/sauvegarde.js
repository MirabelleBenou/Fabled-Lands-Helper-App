// Lot banc-v1 — lecture d'une sauvegarde de la mini-application d'essai.
export const SCHEMA = 1;

// Rend les données au schéma courant, ou lève une exception si le fichier est illisible.
export function lire(objet) {
  if (objet === null || typeof objet !== 'object' || Array.isArray(objet)) {
    throw new Error('sauvegarde illisible');
  }
  if (objet.schema !== SCHEMA) throw new Error('schéma inconnu');
  if (!Array.isArray(objet.personnages)) throw new Error('liste des personnages absente');
  const personnages = objet.personnages.map((p) => {
    if (p === null || typeof p !== 'object' || typeof p.nom !== 'string' || p.nom === '') {
      throw new Error('personnage illisible');
    }
    return { nom: p.nom };
  });
  return { schema: SCHEMA, personnages };
}
