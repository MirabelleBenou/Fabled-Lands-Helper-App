// Lot v0.7 — les listes du livret d'aventure de l'édition française : les codes et les cases de section, par livre
// (le livre 1 seul). Module pur : il s'importe dans Node, rien n'y touche window, document ou indexedDB.

// Une ligne de cases : { section, libelle ('' ou 'chez_vous'), cases (le nombre de cases de la ligne) }.
const ligne = (section, cases = 1, libelle = '') => ({ section, libelle, cases });

export const LIVRETS = {
  1: {
    codes: [
      'Abandonné', 'Acide', 'Affliction', 'Aide', 'Aigreur', 'Air', 'Aklar', 'Alissia', 'Almanach', 'Altitude',
      'Altruiste', 'Amcha', 'Amende', 'Ancre', 'Animal', 'Animosité', 'Antienne', 'Apache', 'Apaisement', 'Apeuré', 'Api',
      'Appât', 'Arbre', 'Arche', 'Arme', 'Armure', 'Arnaqueur', 'Artefact', 'Artère', 'Artisan', 'Assassin', 'Assaut',
      'Assistance', 'Aura', 'Azur',
    ],
    cases: [
      ligne(10, 4), ligne(10, 1, 'chez_vous'), ligne(16), ligne(19, 3), ligne(91), ligne(100, 1, 'chez_vous'), ligne(116),
      ligne(160), ligne(169), ligne(175), ligne(199), ligne(207), ligne(232), ligne(233), ligne(264), ligne(305), ligne(310),
      ligne(331), ligne(337), ligne(361), ligne(398), ligne(403), ligne(409), ligne(446), ligne(454), ligne(473), ligne(496),
      ligne(504), ligne(542), ligne(610), ligne(612), ligne(619), ligne(635), ligne(645), ligne(649), ligne(655), ligne(667),
    ],
  },
};

// Les lignes du livre `livre` dont la section est `section`, dans l'ordre du livret ; [] sans livret ou sans ligne.
export function lignesDeSection(livre, section) {
  const livret = Object.hasOwn(LIVRETS, livre) ? LIVRETS[livre] : null;
  return livret === null ? [] : livret.cases.filter((l) => l.section === section);
}
