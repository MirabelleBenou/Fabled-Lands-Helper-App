// Lot v0.3 — les 9 personnages pré-tirés publiés par l'éditeur pour les livres 1 et 2 : chiffres et possessions de
// départ, rien d'autre (ni portrait, ni histoire). Données en français, comme ce que saisit l'utilisateur.
// Module pur : il s'importe dans Node.
import { personnageNeuf } from './sauvegarde.js';

const GILET = { valeur: 1, raison: 'Gilet en cuir' };

// competences : charisme, combat, magie, piete, exploration, adresse.
export const PRETIRES = [
  { id: 'liana', nom: 'Liana la Vive', profession: 'Voyageuse', niveau: 1, exclusif: false,
    competences: { charisme: 2, combat: 5, magie: 2, piete: 3, exploration: 6, adresse: 4 },
    possessions: ['Lance', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'andriel', nom: 'Andriel le Marteau', profession: 'Guerrier', niveau: 1, exclusif: false,
    competences: { charisme: 3, combat: 6, magie: 2, piete: 4, exploration: 3, adresse: 2 },
    possessions: ['Hache de guerre', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'chalor', nom: 'Chalor l\'Exilé', profession: 'Mage', niveau: 1, exclusif: false,
    competences: { charisme: 2, combat: 2, magie: 6, piete: 1, exploration: 5, adresse: 3 },
    possessions: ['Bâton', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'marana', nom: 'Marana Cœur de Feu', profession: 'Voleuse', niveau: 1, exclusif: false,
    competences: { charisme: 5, combat: 4, magie: 4, piete: 1, exploration: 2, adresse: 6 },
    possessions: ['Épée', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'ignace', nom: 'Ignace le Dévot', profession: 'Prêtre', niveau: 1, exclusif: false,
    competences: { charisme: 4, combat: 2, magie: 3, piete: 6, exploration: 4, adresse: 2 },
    possessions: ['Gourdin', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'astariel', nom: 'Astariel Chanteciel', profession: 'Troubadour', niveau: 1, exclusif: false,
    competences: { charisme: 6, combat: 3, magie: 4, piete: 3, exploration: 2, adresse: 4 },
    possessions: ['Épée', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'rordon', nom: 'Rordon Boisvert', profession: 'Prêtre', niveau: 1, exclusif: true,
    competences: { charisme: 4, combat: 2, magie: 3, piete: 6, exploration: 4, adresse: 2 },
    possessions: ['Gourdin', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  { id: 'madrigua', nom: 'Madrigua aux mille histoires', profession: 'Voyageuse', niveau: 1, exclusif: true,
    competences: { charisme: 2, combat: 5, magie: 2, piete: 3, exploration: 6, adresse: 4 },
    possessions: ['Dague', 'Gilet en cuir'], bonus: { defense: [GILET] } },
  // Sa fiche publiée dit Défense 6 ; la formule donnerait 7 : le malus « Fiche de l'éditeur » suit la fiche.
  { id: 'tjell', nom: 'Tjell Lao-Me', profession: 'Troubadour / Danseuse', niveau: 2, exclusif: true,
    competences: { charisme: 6, combat: 4, magie: 4, piete: 1, exploration: 2, adresse: 5 },
    possessions: ['Bâton de combat', 'Boussole', 'Gilet en cuir'],
    bonus: { exploration: [{ valeur: 1, raison: 'Boussole' }], defense: [GILET, { valeur: -1, raison: 'Fiche de l\'éditeur' }] } },
];

export const pretireParId = (id) => PRETIRES.find((p) => p.id === id) ?? null;

// Le personnage du schéma 2 fabriqué à partir d'un pré-tiré et d'un nom : Endurance 9, Bourse 16, l'initiale et
// l'actuelle de chaque compétence à la valeur du pré-tiré, ses possessions et ses bonus.
export function personnagePretire(pretire, nom, maintenant = new Date(), id = crypto.randomUUID()) {
  const personnage = personnageNeuf(nom, pretire.profession, maintenant, id);
  personnage.niveau = pretire.niveau;
  personnage.endurance = { max: 9, actuelle: 9 };
  personnage.bourse = 16;
  for (const [code, valeur] of Object.entries(pretire.competences)) {
    personnage.competences[code] = { initiale: valeur, actuelle: valeur, bonus: structuredClone(pretire.bonus[code] ?? []) };
  }
  personnage.defense = { bonus: structuredClone(pretire.bonus.defense ?? []) };
  personnage.possessions = [...pretire.possessions];
  personnage.pretire = pretire.id;
  return personnage;
}
